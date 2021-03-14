import {
  blue,
  bold,
  Command,
  green,
  red,
  serve as serveStd,
  Server,
  Spinner,
  Toggle,
  wait,
  Webview,
  yellow,
} from "./deps.ts";
import { loadingTemplate } from "./loader.ts";

const codeview = new Command<void>()
  .name("codeview")
  .description("Deno Coverage Webview Reporter.")
  .arguments<[testFiles?: string, watchFiles?: string]>(
    "[test-files] [watch-files]",
  )
  // Codeview options
  .option<{ watch?: boolean }>(
    "-w, --watch",
    "Enable watch mode",
  )
  .option<{ tmp: string }>(
    "--tmp",
    "Tmp directory for generated coverage files.",
    { default: ".coverage" },
  )
  .option<{ keep?: boolean }>(
    "-k, --keep",
    "Keep tmp directory on exit.",
  )
  .option<{ host: string }>(
    "-H, --host, --hostname <hostname>",
    "The hostname for the web-server.",
    { default: "0.0.0.0" },
  )
  .option<{ port: number }>(
    "-p, --port <port:number>",
    "The port for the web-server.",
    { default: 1717 },
  )
  .option<{ spinner: boolean }>(
    "--no-spinner",
    "Disable spinner and log output directly to stdout.",
  )
  .option<{ debounce: number }>(
    "-d, --debounce <debounce:number>",
    "Delays the file change event in watch mode.",
    { default: 200 },
  )
  // Deno options
  .option<{ allowAll?: boolean }>(
    "-A, --allow-all",
    "Allow all permissions",
  )
  .option<{ allowEnv?: boolean }>(
    "-A, --allow-env",
    "Allow environment access",
  )
  .option<{ allowHrtime?: boolean }>(
    "--allow-hrtime",
    "Allow high resolution time measurement",
  )
  .option<{ allowNet?: boolean | string }>(
    "--allow-net [domains:string]",
    "Allow network access",
  )
  .option<{ allowNone?: boolean }>(
    "--allow-none",
    "Don't return error code if no test files are found",
  )
  .option<{ allowPlugin?: boolean }>(
    "--allow-plugin",
    "Allow loading plugins",
  )
  .option<{ allowRead?: boolean | string }>(
    "--allow-read [files:string]",
    "Allow file system read access",
  )
  .option<{ allowRun?: boolean }>(
    "--allow-run",
    "Allow running subprocesses",
  )
  .option<{ allowWrite?: boolean | string }>(
    "--allow-write [files:string]",
    "Allow file system write access",
  )
  .option<{ cachedOnly?: boolean }>(
    "--cached-only",
    "Require that remote dependencies are already cached",
  )
  .option<{ cert?: string }>(
    "--cert <file:string>",
    "Load certificate authority from PEM encoded file",
  )
  .option<{ config?: string }>(
    "-c, --config <file:string>",
    "Load tsconfig.json configuration file",
  )
  .option<{ failFast?: boolean }>(
    "--fail-fast",
    "Stop on first error",
  )
  .option<{ filter?: string }>(
    "--filter <filter:string>",
    "Run tests with this string or pattern in the test name",
  )
  .option<{ importMap?: string }>(
    "--import-map <file:string>",
    "Load import map file",
  )
  .option<{ location?: string }>(
    "--location <href:string>",
    "Value of 'globalThis.location' used by some web APIs",
  )
  .option<{ logLevel?: "debug" | "info" }>(
    "-L, --log-level <log-level:string>",
    "Set log level [possible values: debug, info]",
  )
  .option<{ check?: boolean }>(
    "--no-check",
    "Skip type checking modules",
  )
  .option<{ remote?: boolean }>(
    "--no-remote",
    "Do not resolve remote modules",
  )
  .option<{ quiet?: boolean }>(
    "-q, --quiet",
    "Suppress diagnostic output",
  )
  .option<{ reload?: boolean | string }>(
    "-r, --reload [cache-blocklist:string]",
    "Reload source code cache (recompile TypeScript)",
  )
  .option<{ seed?: number }>(
    "--seed <number:number>",
    "Seed Math.random()",
  )
  .option<{ unstable?: boolean }>(
    "--unstable",
    "Enable unstable features and APIs",
  )
  .option<{ v8Flags?: string }>(
    "--v8-flags <v8-flags:string>",
    "Set V8 command line options (for help: --v8-flags=--help)",
  )
  .option<{ exclude?: string }>(
    "--exclude <regex:string>",
    "Exclude source files from the report [default: test\.(js|mjs|ts|jsx|tsx)$]",
  )
  .option<{ ignore?: string }>(
    "--ignore <ignore:string>",
    "Ignore coverage files",
  )
  .option<{ include?: string }>(
    "--include <regex:string>",
    "Include source files in the report [default: ^file:]",
  )
  .action(async (
    options,
    testFiles = ".",
    watchFiles: string = testFiles,
  ): Promise<void> => {
    let infoMessage: string = "Initializing codeview....";
    const url = `http://${options.host}:${options.port}`;
    const spinner: Spinner | null = options.spinner
      ? wait(infoMessage).start()
      : null;
    const sig = Deno.signals.interrupt();
    const processes: Set<Deno.Process | Deno.File> = new Set();
    const waitingMessage = "Waiting for file system changes...";
    let webview: Webview | null = null;
    let server: Server | null = null;
    let cleanConfirmed = false;
    let hasExitCalled = false;

    await clean(true).catch((error) => exit(error, false));

    const loadingMessageInterval = setInterval(
      () => {
        webview?.eval(`window.updateLoadingMessage("${infoMessage}")`);
      },
      100,
    );

    Promise.any([
      sig,
      serve(),
      runWebview(),
      options.watch ? watch() : Promise.resolve(),
    ]).then(exit).catch(exit);

    welcome();

    await generate().finally(() => {
      clearInterval(loadingMessageInterval);
      logInfo(waitingMessage);
      webview?.eval(`window.location.href = "${url}"`);
    });

    async function exit(error?: unknown, doClean = true): Promise<void> {
      if (hasExitCalled) {
        return;
      }
      hasExitCalled = true;
      debug("exit called");
      if (error) {
        logError(error);
      }
      if (doClean && cleanConfirmed && !options.keep) {
        await clean(false).catch((error) => exit(error, false));
      }
      closeAllProcesses();
      clearInterval(loadingMessageInterval);
      sig.dispose();
      spinner?.stop();
      webview?.exit();
      server?.close();
      Deno.exit(0);
    }

    async function watch() {
      if (!options.watch) {
        return;
      }
      const watcher: AsyncIterableIterator<Deno.FsEvent> = Deno.watchFs(
        watchFiles,
        {
          recursive: true,
        },
      );

      const update = debounce(async () => {
        await generate();
        webview?.eval("window.location.reload()");
        logInfo(waitingMessage);
      }, options.debounce);

      for await (const event of watcher) {
        if (!event.paths.some((path) => path.includes(options.tmp))) {
          await update();
        }
      }
    }

    const MEDIA_TYPES: Record<string, string> = {
      ".css": "text/css",
      ".gif": "image/gif",
      ".gz": "application/gzip",
      ".htm": "text/html",
      ".html": "text/html",
      ".jpe": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".jpg": "image/jpeg",
      ".js": "application/javascript",
      ".json": "application/json",
      ".jsx": "text/jsx",
      ".map": "application/json",
      ".md": "text/markdown",
      ".mjs": "application/javascript",
      ".png": "image/png",
      ".svg": "image/svg+xml",
      ".ts": "text/typescript",
      ".tsx": "text/tsx",
      ".txt": "text/plain",
      ".wasm": "application/wasm",
    };

    function getContentType(path: string): string | undefined {
      const parts = path.split(".");
      parts.shift();
      const ext = parts[parts.length - 1];
      return ext && MEDIA_TYPES[ext];
    }

    async function serve(): Promise<void> {
      if (server) {
        return;
      }

      debug("Starting server at: %s:%s", options.host, options.port);
      server = serveStd({
        hostname: options.host,
        port: options.port,
      });

      for await (const req of server) {
        const fileName = req.url[req.url.length - 1] === "/"
          ? req.url + "index.html"
          : req.url;
        const path = `${options.tmp}/html${fileName}`;
        try {
          const [file, fileInfo] = await Promise.all([
            Deno.open(path),
            Deno.stat(path),
          ]);
          const headers = new Headers();
          headers.set("content-length", fileInfo.size.toString());
          const contentType = getContentType(path);
          if (contentType) {
            headers.set("content-type", contentType);
          }
          req.done.then(() => file.close());
          debug("%s %s %s", blue("GET"), green("200"), path);
          req.respond({
            status: 200,
            body: file,
            headers,
          });
        } catch (error) {
          if (error instanceof Deno.errors.NotFound) {
            debug("%s %s %s", blue("GET"), red("404"), path);
            req.respond({ status: 404, body: "Not Found" });
          } else {
            debug("%s %s %s", blue("GET"), red("500"), path);
            logError(error);
            req.respond({ status: 500, body: "Internal Server Error" });
          }
        }
      }
    }

    async function runWebview() {
      webview = new Webview({
        url: `data:text/html,${
          encodeURIComponent(
            loadingTemplate.replace("{{subtitle}}", infoMessage),
          )
        }`,
        frameless: false,
        resizable: true,
        debug: options.logLevel === "debug",
        title: "Coverage Report",
      });
      return webview.run();
    }

    async function generate() {
      closeAllProcesses();
      try {
        await test();
        await coverage();
        await html();
      } catch (error) {
        logError(error);
      } finally {
        closeAllProcesses();
      }
    }

    function closeAllProcesses() {
      processes.forEach((process) => {
        try {
          process.close();
        } catch (error) {
          // ignore error
        }
        try {
          if (process instanceof Deno.Process) {
            process.kill(Deno.Signal.SIGKILL);
          }
        } catch (error) {
          // ignore error
        }
      });
      processes.clear();
    }

    function welcome() {
      log();
      log(
        blue("  Web server is running at: %s 🚀"),
        green(url),
      );
      log(
        blue("  Watch mode: %s ⌚"),
        options.watch ? green("enabled") : red("disabled"),
      );
      log();
    }

    async function clean(confirm: boolean): Promise<void> {
      if (
        !await Deno.lstat(options.tmp).then(() => true).catch(() => false)
      ) {
        cleanConfirmed = true;
        return;
      }

      if (confirm) {
        log(
          "%s tmp directory %s already exists!",
          yellow(`[Warning]`),
          bold(options.tmp),
        );
        log(
          "%s Existing files in this directory will be deleted!",
          yellow(`[Warning]`),
        );
        spinner?.stop();

        const abort = !await Toggle.prompt({
          message: "Continue and delete existing tmp directory?",
          default: false,
          indent: "",
        });

        if (abort) {
          Deno.exit(0);
        }
        cleanConfirmed = true;
      }

      if (cleanConfirmed) {
        logInfo("Deleting tmp directory...");
        await run({
          cmd: ["rm", "-rf", options.tmp],
        });
      } else {
        debug("Prevent deleting tmp directory!");
      }
    }

    async function test() {
      logInfo("Running tests...");
      await run({
        cmd: [
          "deno",
          "test",
          `--coverage=${options.tmp}/cov`,
          "--unstable",
          ...Object.entries(options)
            .filter(([name]) =>
              ![
                "unstable",
                "watch",
                "tmp",
                "port",
                "spinner",
                "debounce",
                "check",
                "remote",
                "host",
                "keep",
                "maximize",
              ]
                .includes(name)
            )
            .map(([name, value]) =>
              value && value !== true
                ? `--${paramCase(name)}=${String(value)}`
                : `--${paramCase(name)}`
            ),
          ...(options.check === false ? ["--no-check"] : []),
          ...(options.remote === false ? ["--no-remote"] : []),
          ...(testFiles ? [testFiles] : []),
        ],
      });
    }

    async function coverage() {
      logInfo("Generating lcov coverage report...");
      await run({
        cmd: [
          "deno",
          "coverage",
          "--unstable",
          `${options.tmp}/cov`,
          "--lcov",
          ...(options.quiet ? ["--quiet"] : []),
          ...(options.logLevel ? [`--log-level=${options.logLevel}`] : []),
        ],
        process: async (process) => {
          if (process.stdout) {
            debug("Reading cov.lcov...");
            const lcov: Deno.File = await Deno.open(
              `${options.tmp}/cov.lcov`,
              {
                create: true,
                write: true,
              },
            );
            processes.add(lcov);
            await Deno.copy(process.stdout, lcov);
          }
        },
      });
    }

    async function html() {
      logInfo("Generating html report...");
      await run({
        cmd: [
          "genhtml",
          "-o",
          `${options.tmp}/html`,
          `${options.tmp}/cov.lcov`,
        ],
      });
    }

    type RunOptions = {
      process?: (process: Deno.Process) => Promise<void>;
      cmd: Array<string>;
    };

    async function run(opts: RunOptions) {
      debug(blue("$ %s"), opts.cmd.join(" "));
      const process = Deno.run({
        stdout: !opts.process && options.logLevel === "debug"
          ? "inherit"
          : "piped",
        stderr: options.logLevel === "debug" ? "inherit" : "piped",
        cmd: opts.cmd,
      });

      processes.add(process);

      const [status] = await Promise.all([
        process.status(),
        opts.process?.(process),
      ]);

      if (!status.success) {
        debug(yellow("Failed: %s"), opts.cmd.join(" "), status);
        if (status.signal) {
          // don't throw an error on signal!
          return;
        }

        let output: string = new TextDecoder().decode(await process.output());
        const errorMsg: string = new TextDecoder().decode(
          await process.stderrOutput(),
        );

        if (errorMsg.trim()) {
          output += "\n\n" + errorMsg;
        }

        throw new Error(output || "Unknown error");
      }
      debug(green("Done: %s"), opts.cmd.join(" "));
    }

    function logInfo(message: string) {
      infoMessage = message;
      if (spinner && options.spinner) {
        spinner.text = message;
      } else {
        log(message);
      }
      webview?.eval(`window.updateLoadingMessage("${message}")`);
    }

    function log(...args: Array<unknown>) {
      spinner?.stop();
      console.log(...args);
      spinner?.start();
    }

    function debug(...args: Array<unknown>) {
      if (options.logLevel === "debug") {
        log(...args);
      }
    }

    function logError(...args: Array<unknown>) {
      spinner?.stop();
      console.error(...args);
      spinner?.start();
    }

    // deno-lint-ignore no-explicit-any
    function debounce<T extends (...args: Array<any>) => void | Promise<void>>(
      func: T,
      wait: number,
    ): T {
      let timeout: number | null;
      return ((...args: Array<unknown>) => {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
          timeout = null;
          func(...args);
        }, wait);
        // deno-lint-ignore no-explicit-any
      }) as any;
    }
  });

if (import.meta.main) {
  await codeview.parse();
}

function paramCase(str: string): string {
  return str.replace(
    /([a-z][A-Z])/g,
    (g) => g[0] + "-" + g[1].toLowerCase(),
  );
}
