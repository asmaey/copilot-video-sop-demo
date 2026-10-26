import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { joinSession, createCanvas, CanvasError } from "@github/copilot-sdk/extension";
import { renderHtml } from "./renderer.mjs";

const servers = new Map();
const segment = "[A-Za-z0-9][A-Za-z0-9_-]*";
const inputSchema = {
    type: "object",
    properties: {
        documentId: { type: "string", pattern: `^${segment}$` },
        artifactRoot: { type: "string", pattern: `^${segment}(?:/${segment})*$` },
    },
    required: ["documentId"],
    additionalProperties: false,
};
let session;

function artifactDirectory(input) {
    if (!session?.workspacePath) {
        throw new CanvasError("workspace_missing", "A session workspace is required to load SOP artifacts.");
    }

    const rootSegments = (input.artifactRoot ?? "sop-artifacts").split("/");
    const workspace = resolve(session.workspacePath);
    const directory = resolve(workspace, ...rootSegments, input.documentId);
    if (directory !== workspace && !directory.startsWith(`${workspace}${sep}`)) {
        throw new CanvasError("artifact_path_invalid", "The requested SOP artifact directory is outside the workspace.");
    }
    return directory;
}

function assertStep(step) {
    if (!step || !/^[a-z][a-z0-9-]*$/.test(step.id) ||
        !/^frame-\d{3}\.jpg$/.test(step.frame) ||
        !Number.isFinite(step.timestampSeconds) ||
        typeof step.title !== "string" || typeof step.instruction !== "string" ||
        typeof step.caption !== "string" || typeof step.expected !== "string" ||
        typeof step.evidence !== "string") {
        throw new CanvasError("sop_invalid", "A stored SOP step has invalid text, evidence, or identity.");
    }
}

async function loadDocument(input) {
    const doc = JSON.parse(await readFile(join(artifactDirectory(input), "sop.json"), "utf8"));
    if (doc.documentId !== input.documentId || !Array.isArray(doc.steps) || !doc.steps.length) {
        throw new CanvasError("sop_invalid", "The stored SOP has an invalid identity or no steps.");
    }
    for (const step of doc.steps) assertStep(step);
    return doc;
}

async function startServer(input) {
    const server = createServer(async (req, res) => {
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Referrer-Policy", "no-referrer");
        res.setHeader("Content-Security-Policy",
            "default-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'");
        try {
            const address = server.address();
            if (!address || typeof address === "string" || req.headers.host !== `127.0.0.1:${address.port}`) {
                res.writeHead(403).end("Invalid host");
                return;
            }
            if (req.method !== "GET") {
                res.writeHead(405, { Allow: "GET" }).end("Only GET is supported");
                return;
            }

            const path = new URL(req.url, "http://127.0.0.1").pathname;
            if (path === "/style.css" || path === "/client.js") {
                res.setHeader("Content-Type", path.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8");
                res.end(await readFile(new URL(`.${path}`, import.meta.url)));
                return;
            }

            const doc = await loadDocument(input);
            const frame = doc.steps.find(step => `/frames/${step.frame}` === path);
            if (frame) {
                res.setHeader("Content-Type", "image/jpeg");
                res.end(await readFile(join(artifactDirectory(input), "frames", frame.frame)));
                return;
            }
            if (path === "/" || path === "/export") {
                let images;
                let css;
                if (path === "/export") {
                    images = Object.fromEntries(await Promise.all(doc.steps.map(async step => [
                        step.frame,
                        `data:image/jpeg;base64,${(await readFile(join(artifactDirectory(input), "frames", step.frame))).toString("base64")}`,
                    ])));
                    css = await readFile(new URL("./style.css", import.meta.url), "utf8");
                    res.setHeader("Content-Disposition", `attachment; filename="${input.documentId}-sop.html"`);
                }
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.end(renderHtml(doc, { images, css }));
                return;
            }
            res.writeHead(404).end("SOP resource not found");
        } catch (error) {
            await session.log(`SOP canvas request failed: ${error.message}`, { level: "error" });
            if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Unable to load the SOP or its evidence. See the extension log.");
        }
    });
    await new Promise((resolveListen, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolveListen);
    });
    const address = server.address();
    return { server, url: `http://127.0.0.1:${address.port}/` };
}

session = await joinSession({
    canvases: [createCanvas({
        id: "video-sop",
        displayName: "Video to SOP",
        description: "Read a draft SOP with timestamped screenshots, action text, evidence notes, and a self-contained HTML export.",
        inputSchema,
        actions: [{
            name: "get_document",
            description: "Read an SOP and verify that every referenced screenshot is a JPEG file.",
            inputSchema,
            handler: async ctx => {
                const doc = await loadDocument(ctx.input);
                const evidence = await Promise.all(doc.steps.map(async step => {
                    const bytes = await readFile(join(artifactDirectory(ctx.input), "frames", step.frame));
                    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
                        throw new CanvasError("frame_invalid", `Invalid JPEG evidence: ${step.frame}`);
                    }
                    return { frame: step.frame, bytes: bytes.length };
                }));
                return { document: doc, artifactDirectory: artifactDirectory(ctx.input), evidence };
            },
        }],
        open: async ctx => {
            await loadDocument(ctx.input);
            let entry = servers.get(ctx.instanceId);
            if (!entry) {
                entry = await startServer(ctx.input);
                servers.set(ctx.instanceId, entry);
            }
            return { title: `SOP | ${ctx.input.documentId}`, url: entry.url };
        },
        onClose: async ctx => {
            const entry = servers.get(ctx.instanceId);
            if (entry) {
                servers.delete(ctx.instanceId);
                await new Promise(resolveClose => entry.server.close(resolveClose));
            }
        },
    })],
});
