from flask import Flask, render_template, request, jsonify
import sys
import io
import contextlib
import traceback

app = Flask(__name__)


def serialize_value(v, depth=0, max_depth=2):
    """
    Turn a Python value into a JSON-friendly structure for env visualization.
    """
    if depth > max_depth:
        return {"type": type(v).__name__, "repr": repr(v)}

    try:
        tname = type(v).__name__
    except Exception:
        tname = "unknown"

    if isinstance(v, (int, float, bool, type(None))):
        return {"type": tname, "value": v}

    if isinstance(v, str):
        preview = v if len(v) <= 40 else v[:37] + "..."
        return {"type": "str", "value": preview}

    if isinstance(v, (list, tuple)):
        elems = [serialize_value(item, depth + 1, max_depth) for item in v[:10]]
        return {"type": tname, "length": len(v), "elements": elems}

    if isinstance(v, dict):
        fields = {}
        for key, val in list(v.items())[:12]:
            key_str = key if isinstance(key, str) else repr(key)
            fields[key_str] = serialize_value(val, depth + 1, max_depth)
        return {"type": "dict", "fields": fields}

    return {"type": tname, "repr": repr(v)}


def describe_line(line: str) -> str:
    """
    Shared helper: given a *stripped* line of code, return a short description.
    """
    if line.startswith("for "):
        return "Loop over a sequence: " + line
    elif line.startswith("while "):
        return "Repeat while a condition is true: " + line
    elif line.startswith("if "):
        return "Check a condition and branch: " + line
    elif line.startswith("elif ") or line.startswith("else"):
        return "Handle an alternative case: " + line
    elif line.startswith("def "):
        return "Define a function: " + line
    elif line.startswith("class "):
        return "Define a class (data + behavior): " + line
    elif "input(" in line:
        return "Get input from the user: " + line
    elif line.startswith("print("):
        return "Display something to the user: " + line
    elif not line:
        return "Blank line"
    else:
        return "Compute or update something: " + line


def hint_for_line(line: str) -> str:
    """
    Turn a code line into a student-facing hint.
    """
    stripped = line.strip()
    base = describe_line(stripped)

    # Very lightweight hint “templates”
    if stripped.startswith("for ") or stripped.startswith("while "):
        extra = "Check that the loop will run the number of times you expect."
    elif "append(" in stripped:
        extra = "Think: which list are you changing and what are you adding to it?"
    elif "len(" in stripped:
        extra = "Ask yourself: what collection are you measuring here?"
    elif stripped.startswith("print("):
        extra = "Check if this prints the information you want the user to see."
    elif stripped.startswith("if ") or stripped.startswith("elif ") or stripped.startswith("else"):
        extra = "Consider what happens in each branch of this condition."
    else:
        extra = "Does this step move you closer to your goal (like building the collection or showing results)?"

    return f"At this step, you {base[0].lower() + base[1:]}. {extra}"


def run_code_with_trace(code: str):
    """
    Execute user code and collect:
    - line number
    - code line
    - locals (repr)
    - env diagram (structured types)
    - a hint for this step
    Plus stdout and a short error string if any.
    """
    trace_log = []
    code_lines = code.splitlines()  # keep original spacing

    def tracer(frame, event, arg):
        if event == "line" and frame.f_code.co_filename == "<user_code>":
            lineno = frame.f_lineno

            # raw locals
            locals_raw = {
                k: v
                for k, v in frame.f_locals.items()
                if not k.startswith("__") and k != "__builtins__"
            }

            # repr locals
            vars_filtered = {}
            for k, v in locals_raw.items():
                try:
                    vars_filtered[k] = repr(v)
                except Exception:
                    vars_filtered[k] = "<unrepr-able>"

            env_variables = {
                name: serialize_value(val) for name, val in locals_raw.items()
            }

            code_line = code_lines[lineno - 1] if 1 <= lineno <= len(code_lines) else ""
            hint = hint_for_line(code_line)

            trace_log.append(
                {
                    "line": lineno,
                    "code": code_line,
                    "locals": vars_filtered,
                    "env": {"variables": env_variables},
                    "hint": hint,
                }
            )
        return tracer

    old_trace = sys.gettrace()
    sys.settrace(tracer)
    stdout = io.StringIO()

    try:
        with contextlib.redirect_stdout(stdout):
            exec(compile(code, "<user_code>", "exec"), {})
        output = stdout.getvalue()
        error = ""
    except Exception:
        output = stdout.getvalue()
        error = traceback.format_exc(limit=1)
    finally:
        sys.settrace(old_trace)

    return {"trace": trace_log, "output": output, "error": error}


def generate_algorithm_steps(code: str):
    """
    SUPER SIMPLE 'AI' for now:
    One step per non-blank, non-comment line, with:
    - line number
    - original code
    - short description
    """
    steps = []
    lines = code.splitlines()

    for i, raw in enumerate(lines, start=1):
        stripped = raw.strip()
        if not stripped or stripped.startswith("#"):
            continue

        desc = describe_line(stripped)

        steps.append(
            {
                "line": i,
                "code": raw,  # original formatting
                "description": desc,
            }
        )

    return steps


@app.route("/")
def index():
    # If you're using React on a different port, you may not even hit this.
    return render_template("index.html")


@app.route("/run", methods=["POST"])
def run():
    data = request.get_json(force=True)
    code = data.get("code", "")

    trace_result = run_code_with_trace(code)
    algo_steps = generate_algorithm_steps(code)

    return jsonify(
        {
            "trace": trace_result["trace"],
            "output": trace_result["output"],
            "error": trace_result["error"],
            "algorithmic_steps": algo_steps,
        }
    )


if __name__ == "__main__":
    # Debug mode for development only
    app.run(debug=True, host="0.0.0.0", port=8080)
