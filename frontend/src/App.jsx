import { useState } from "react";
import "./index.css";

const pokemonRequest =
  "I want to track my Pokémon cards — name, rarity, and price — and then print them out at the end.";

const planSteps = [
  "Decide how to store each card (we'll use a dictionary with name, rarity, and price).",
  "Make an empty list called collection to hold all the cards.",
  "Add a few Pokémon card dictionaries to the list.",
  "Loop through collection and print each card in a nice sentence.",
  "At the end, print how many cards are in your collection.",
];

const pokemonCode = `pikachu = {"name": "Pikachu", "rarity": "Common", "price": 2.50}
charizard = {"name": "Charizard", "rarity": "Ultra Rare", "price": 150.0}
eevee = {"name": "Eevee", "rarity": "Uncommon", "price": 5.0}

collection = []

collection.append(pikachu)
collection.append(charizard)
collection.append(eevee)

for card in collection:
    print(card["name"], "-", card["rarity"], "- $", card["price"])

print("You have", len(collection), "cards in your collection.")`;

const executionTrace = [
    {
    line: 1,
    locals: {
      pikachu: "{name:'Pikachu', rarity:'Common', price:2.50}",
    },
    hint:
      "You define a dictionary for Pikachu with name, rarity, and price.",
    step: 1,
  },
  {
    line: 2,
    locals: {
      pikachu: "{...}",
      charizard: "{name:'Charizard', rarity:'Ultra Rare', price:150.0}",
    },
    hint:
      "You define a dictionary for Charizard. Notice it has a much higher price.",
    step: 1,
  },
  {
    line: 3,
    locals: {
      pikachu: "{...}",
      charizard: "{...}",
      eevee: "{name:'Eevee', rarity:'Uncommon', price:5.0}",
    },
    hint:
      "You define a dictionary for Eevee, another card in your collection.",
    step: 1,
  },
  {
    line: 5,
    locals: { collection: "[]" ,
      pikachu: "{...}",
      charizard: "{...}",
      eevee: "{...}",
    },
    hint:
      "You create an empty list called collection. This will hold all of your Pokémon cards.",
    step: 2,
  },
  {
    line: 7,
    locals: {
      collection: "[pikachu]",
      pikachu: "{...}",
      charizard: "{...}",
      eevee: "{...}",
    },
    hint:
      "You append Pikachu to collection. Now the list has 1 card.",
    step: 3,
  },
  {
    line: 8,
    locals: {
      collection: "[pikachu, charizard]",
      pikachu: "{...}",
      charizard: "{...}",
      eevee: "{...}",
    },
    hint:
      "You append Charizard to collection. Now there are 2 cards.",
    step: 3,
  },
  {
    line: 9,
    locals: {
      collection: "[pikachu, charizard, eevee]",
      pikachu: "{...}",
      charizard: "{...}",
      eevee: "{...}",
    },
    hint:
      "You append Eevee to collection. Now the list has all 3 cards.",
    step: 3,
  },
  {
    line: 12,
    locals: {
      collection: "[…3 cards…]",
      card: "pikachu {...}",
    },
    hint:
      "The loop starts. On this iteration, card refers to the Pikachu dictionary.",
      step: 4,
  },
  {
    line: 12,
    locals: {
      collection: "[…3 cards…]",
      card: "charizard {...}",
    },
    hint:
      "Second loop iteration: now card refers to Charizard.",
      step: 4,
  },
  {
    line: 12,
    locals: {
      collection: "[…3 cards…]",
      card: "eevee {...}",
    },
    hint:
      "Third loop iteration: now card refers to Eevee.",
      step: 4,
  },
  {
    line: 14,
    locals: {
      collection: "[…3 cards…]",
    },
    hint:
      "You print the total number of cards using len(collection).",
      step: 5,
  },
];
const programOutput = {
  0: "",
  1: `Pikachu - Common - $ 2.5`,
  2: `Pikachu - Common - $ 2.5
Charizard - Ultra Rare - $ 150.0`,
  3: `Pikachu - Common - $ 2.5
Charizard - Ultra Rare - $ 150.0
Eevee - Uncommon - $ 5.0`,
  4: `Pikachu - Common - $ 2.5
Charizard - Ultra Rare - $ 150.0
Eevee - Uncommon - $ 5.0
You have 3 cards in your collection.`,
}


function App() {
  const [planIndex, setPlanIndex] = useState(0);
  const [traceIndex, setTraceIndex] = useState(0);

  const currentTrace = executionTrace[traceIndex];
  const codeLines = pokemonCode.split("\n");

  // Max line that should be revealed, based on steps we've taken in the trace
  const maxRevealedLine = Math.max(
    ...executionTrace.slice(0, traceIndex + 1).map((step) => step.line)
  );

  const goNext = () => {

    if (traceIndex < executionTrace.length-1) {
      const currStep  = executionTrace[traceIndex].step;
      const nextStep = executionTrace[traceIndex + 1].step;
      if (currStep < nextStep) {
        setPlanIndex((i) => Math.min(i + 1, planSteps.length - 1));
      }
    }
    setTraceIndex((i) => Math.min(i + 1, executionTrace.length - 1));
  };

  const goPrev = () => {
    if (traceIndex > 0) {
      const currStep  = executionTrace[traceIndex].step;
      const nextStep = executionTrace[traceIndex - 1].step;
      if (currStep > nextStep) {
        setPlanIndex((i) => Math.max(i - 1, 0));
      }
    }
    setTraceIndex((i) => Math.max(i - 1, 0));
  };

  const reset = () => {
    setPlanIndex(0);
    setTraceIndex(0);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Pokémon Project – AI Scaffold Demo</h1>
        <p>
          A single hard-coded interaction: a student describes a Pokémon project, the AI suggests
          algorithmic steps, and we reveal the code & execution line by line.
        </p>
      </header>

      <main className="layout">
        {/* Left: Chat / Plan */}
        <section className="panel">
          <h2>1. Student Request &amp; AI Plan</h2>
          <div className="chat-bubble student">
            <div className="label">Student</div>
            <p>{pokemonRequest}</p>
          </div>

          <div className="chat-bubble ai">
            <div className="label">AI Tutor</div>
            <p>Great idea! Let&apos;s break this into steps:</p>
            <ol className="plan-list">
              {planSteps.map((step, idx) => (
                <li key={idx} className={idx === planIndex ? "active-step" : ""}>
                  <span className="step-number">{idx + 1}</span> {step}
                </li>
              ))}
            </ol>
            <p className="hint">
              Highlighted step: {planIndex + 1} / {planSteps.length}
            </p>
          </div>

          <div className="controls">
            <button onClick={goPrev} disabled={traceIndex === 0}>
              ◀ Previous
            </button>
            <button onClick={goNext} disabled={planIndex === planSteps.length - 1}>
              Next ▶
            </button>
            <button onClick={reset}>Reset ↺</button>
          </div>
        </section>

        {/* Middle: Code revealed line by line + hint only for current line */}
        <section className="panel">
          <h2>2. Student-Written Code (revealed line by line)</h2>

          <pre className="code-block">
            {codeLines.map((line, idx) => {
              const lineNumber = idx + 1;

              // Hide lines that haven't been "reached" yet
              if (lineNumber > maxRevealedLine) {
                return null;
              }

              const isCurrent = currentTrace?.line === lineNumber;
              const currentHint = isCurrent ? currentTrace?.hint : null;

              return (
                <div key={idx} className="code-line-wrapper">
                  <div
                    className={
                      isCurrent ? "code-line code-line-active" : "code-line"
                    }
                  >
                    <span className="code-lineno">
                      {lineNumber.toString().padStart(2, " ")}
                    </span>
                    <span className="code-text">{line || " "}</span>
                  </div>

                  {isCurrent && currentHint && (
                    <div className="code-hint">
                      💡 {currentHint}
                    </div>
                  )}
                </div>
              );
            })}
          </pre>

          <p className="hint">
            At the start, only the first line is visible. Each Next click both advances execution
            and reveals more of the student&apos;s code.
          </p>
        </section>

        {/* Right: Execution trace + output */}
        <section className="panel">
          <h2>3. Execution Trace &amp; Output</h2>

          <div className="trace-info">
            <div className="trace-row">
              <span className="trace-label">Trace step:</span>
              <span>
                {traceIndex + 1} / {executionTrace.length}
              </span>
            </div>
            <div className="trace-row">
              <span className="trace-label">Current line:</span>
              <span>{currentTrace?.line}</span>
            </div>
            <div className="trace-row">
              <span className="trace-label">Locals at this point:</span>
              <pre className="locals-pre">
                {JSON.stringify(currentTrace?.locals || {}, null, 2)}
              </pre>
            </div>
          </div>

          <h3>Program Output</h3>
          {traceIndex > 6 ? <pre className="output-block">{programOutput[traceIndex-6]}</pre> : <pre className="output-block">{programOutput[0]}</pre>}

          <p className="hint">
            This panel stays “lower level,” while the middle panel reveals the student&apos;s code
            and a teacher-like hint at each step.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
