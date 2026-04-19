import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import postcss from "rollup-plugin-postcss";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "package.json"), "utf8"));

const peerDeps = Object.keys(packageJson.peerDependencies ?? {});

export default [
    {
        input: "src/index.ts",
        output: [
            {
                file: "dist/index.cjs.js",
                format: "cjs",
                sourcemap: true,
                exports: "named",
                interop: "auto",
                inlineDynamicImports: true,
            },
            {
                file: "dist/index.esm.js",
                format: "esm",
                sourcemap: true,
                inlineDynamicImports: true,
            },
        ],
        plugins: [
            peerDepsExternal(),
            resolve(),
            commonjs(),
            typescript({ tsconfig: "./tsconfig.json" }),
            postcss({
                extract: path.resolve(__dirname, "dist/editable-table.css"),
                // Ship readable CSS; app bundlers minify for production.
                minimize: false,
            }),
        ],
        external: [...peerDeps, "react/jsx-runtime"],
    },
    {
        input: "src/index.ts",
        output: [{ file: "dist/index.d.ts", format: "es" }],
        plugins: [dts.default()],
        external: [/\.css$/],
    },
];
