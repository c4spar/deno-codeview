import {
  Application,
  blue,
  Command,
  green,
  red,
  send,
  Spinner,
  wait,
  Webview,
} from "./deps.ts";

const codeview = new Command<void>()
  .name("codeview")
  .description("Code coverage webview for Deno.")
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
    "Web-server port which is started to serve the web-view.",
  )
  .option<{ debounce: number }>(
    "--debounce",
    "Web-server port which is started to serve the web-view.",
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
  .option<{ allowNet?: string }>(
    "--allow-net [domains]",
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
  .option<{ allowRead?: string }>(
    "--allow-read [files]",
    "Allow file system read access",
  )
  .option<{ allowRun?: boolean }>(
    "--allow-run",
    "Allow running subprocesses",
  )
  .option<{ allowWrite?: string }>(
    "--allow-write [files]",
    "Allow file system write access",
  )
  .option<{ cachedOnly?: boolean }>(
    "--cached-only",
    "Require that remote dependencies are already cached",
  )
  .option<{ cert?: string }>(
    "--cert <file>",
    "Load certificate authority from PEM encoded file",
  )
  .option<{ config?: string }>(
    "-c, --config <file>",
    "Load tsconfig.json configuration file",
  )
  .option<{ failFast?: boolean }>(
    "--fail-fast",
    "Stop on first error",
  )
  .option<{ filter?: string }>(
    "--filter <filter>",
    "Run tests with this string or pattern in the test name",
  )
  .option<{ importMap?: string }>(
    "--import-map <file>",
    "Load import map file",
  )
  .option<{ location?: string }>(
    "--location <href>",
    "Value of 'globalThis.location' used by some web APIs",
  )
  .option<{ logLevel?: string }>(
    "-L, --log-level <log-level>",
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
  .option<{ reload?: boolean }>(
    "-r, --reload <cache-blocklist>",
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
    "--v8-flags <v8-flags>",
    "Set V8 command line options (for help: --v8-flags=--help)",
  )
  .option<{ exclude?: string }>(
    "--exclude <regex>",
    "Exclude source files from the report [default: test\.(js|mjs|ts|jsx|tsx)$]",
  )
  .option<{ ignore?: string }>(
    "--ignore <ignore>",
    "Ignore coverage files",
  )
  .option<{ include?: string }>(
    "--include <regex>",
    "Include source files in the report [default: ^file:]",
  )
  .action(async (
    options,
    testFiles = ".",
    watchFiles: string = testFiles,
  ): Promise<void> => {
    const url = `http://${options.host}:${options.port}`;
    const spinner: Spinner | null = options.spinner
      ? wait("Initializing codeview...").start()
      : null;
    const webview: Webview = new Webview({
      url,
      frameless: false,
      resizable: true,
      title: "Coverage Report",
    });
    const sig = Deno.signals.interrupt();
    const controller = new AbortController();
    const processes: Set<Deno.Process | Deno.File> = new Set();
    const waitingMessage = "Waiting for file system changes...";
    let app: Application | null = null;

    try {
      signals();
      await clean();
      await generate();
      await serve();
      webview.run().then(exit).catch(exit);
      options.watch && watch().catch(exit);
      welcome();
    } catch (error) {
      exit(error);
    }

    async function signals() {
      for await (const _ of sig) {
        sig.dispose();
        spinner?.stop();
        webview.exit();
        controller.abort();
        Deno.exit(0);
      }
    }

    function exit(error?: unknown) {
      error && handleError(error);
      closeAllProcesses();
      sig.dispose();
      spinner?.stop();
      webview.exit();
      controller.abort();
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
        webview.eval("window.location.reload()");
        logSpinner(waitingMessage);
      }, options.debounce);

      for await (const event of watcher) {
        if (!event.paths.some((path) => path.includes(options.tmp))) {
          update();
        }
      }
    }

    function serve(): Promise<void> {
      return new Promise((resolve) => {
        if (app) {
          return;
        }
        app = new Application();

        app.use(async (ctx) => {
          await send(ctx, ctx.request.url.pathname, {
            root: `${options.tmp}/html`,
            index: "index.html",
          });
        });

        app.addEventListener("listen", () => resolve());
        // app.addEventListener("error", (event) => handleError(event.error));

        app.listen({
          hostname: options.host,
          port: options.port,
          signal: controller.signal,
        });
      });
    }

    async function generate() {
      closeAllProcesses();
      try {
        await test();
        await coverage();
        await html();
      } catch (error) {
        handleError(error);
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
      logSpinner(waitingMessage);
    }

    async function clean() {
      logSpinner("Cleaning tmp directory...");
      await run({
        cmd: ["rm", "-r", "-f", options.tmp],
      });
    }

    async function test() {
      logSpinner("Running tests...");
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
      logSpinner("Running tests done...");
    }

    async function coverage() {
      logSpinner("Generating coverage report...");
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
            logSpinner("Reading cov.lcov...");
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
      logSpinner("Generating html report...");
      await run({
        cmd: [
          "genhtml",
          "-o",
          `${options.tmp}/html`,
          `${options.tmp}/cov.lcov`,
        ],
      });
    }

    type RunOptions = Deno.RunOptions & {
      process?: (process: Deno.Process) => Promise<void>;
    };

    async function run(opts: RunOptions) {
      const process = Deno.run({
        stdout: "piped",
        stderr: "piped",
        cmd: opts.cmd,
      });

      processes.add(process);

      const [status] = await Promise.all([
        process.status(),
        opts.process?.(process),
      ]);

      if (!status.success) {
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
    }

    function logSpinner(message: string) {
      if (spinner && options.spinner) {
        spinner.text = message;
      } else {
        log(message);
      }
    }

    function log(...args: Array<unknown>) {
      spinner?.stop();
      console.log(...args);
      spinner?.start();
    }

    function logError(...args: Array<unknown>) {
      spinner?.stop();
      console.error(...args);
      spinner?.start();
    }

    function handleError(...args: Array<unknown>) {
      closeAllProcesses();
      logError(
        ...args.map((arg) =>
          // red(
          arg instanceof Error && arg.stack || String(arg)
          // )
        ),
      );
    }

    // deno-lint-ignore no-explicit-any
    function debounce<T extends (...args: Array<any>) => void | Promise<void>>(
      func: T,
      wait: number,
    ): T {
      var timeout: number | null;
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
