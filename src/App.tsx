import { Fragment, useMemo, useState } from "react";
import MiniFlag from "./lib/encoder/miniflag";
import MiniFlagSvgRenderer from "./lib/renderer/MiniFlagSvgRenderer";
import { toImgString } from "./lib/renderer/svg";
import { FLAGS } from "./lib/flags";
import type { Context } from "./lib/types";
import { generateRandomFlag } from "./lib/random";
import decodeMiniFlag from "./lib/minidecode";

const miniflag = new MiniFlag();
window.mf = miniflag;

function getRandomFlagCode(): string {
  const { data } = new MiniFlag().encode(generateRandomFlag());
  return data;
}

function App() {
  const [flagCode, setFlagCode] = useState("");

  let context: Context | null = null;
  let flagSvg: string | null = null;
  if (flagCode) {
    const renderer = new MiniFlagSvgRenderer();
    try {
      context = miniflag.decode(flagCode);
      flagSvg = renderer.render(context);
    } catch (error) {
      console.error("Error rendering flag:", error);
    }
  }

  const allFlags = useMemo(() => {
    return FLAGS.map((flag) => {
      const encodedFlag = miniflag.encode(flag.context);
      const svg = decodeMiniFlag(encodedFlag.data);

      return {
        code: flag.code,
        country: flag.country,
        data: encodedFlag.data,
        bitLength: encodedFlag.bitLength,
        context: flag.context,
        svg,
      };
    }).sort((a, b) => a.bitLength - b.bitLength);
  }, []);
  window.flags = allFlags;

  return (
    <div style={{}}>
      <input
        type="text"
        value={flagCode}
        onChange={(e) => setFlagCode(e.target.value)}
        placeholder="Enter flag code"
      />
      <button onClick={() => setFlagCode(getRandomFlagCode())}>Random</button>
      <br />

      <img
        src={toImgString(flagSvg ?? "")}
        alt="Flag"
        style={{
          width: "200px",
          height: "auto",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />

      <div
        style={{
          marginTop: "20px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
        }}
      >
        <b>Country Name</b>
        <b>MiniFlag</b>
        <b>Real Flag</b>

        {allFlags.map((flag) => {
          return (
            <Fragment key={flag.code}>
              <div style={{ wordBreak: "break-word" }}>
                <b>{flag.country}</b>
                <br />
                <code>{flag.data}</code>
                <br />
                <span>{flag.bitLength} bits</span>
              </div>

              <img
                src={toImgString(flag.svg)}
                alt={flag.country}
                style={{
                  width: "200px",
                  height: "auto",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
              <img
                src={`https://www.worldometers.info/images/flags/original/${flag.code.toLowerCase()}.webp`}
                alt={flag.country}
                style={{
                  width: "200px",
                  height: "auto",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                }}
              />
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default App;
