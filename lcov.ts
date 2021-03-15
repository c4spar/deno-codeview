export { readLines } from "https://deno.land/std@0.90.0/io/bufio.ts";

export interface LineCoverage {
  line: number;
  hit: number;
  checksum?: string;
}

export interface FunctionCoverage {
  name: string;
  line: number;
  hit: number;
}

export interface BranchCoverage {
  line: number;
  block: number;
  branch: number;
  taken: number;
}

export interface Source {
  name?: string;
  file: string;
  lines: {
    found: number;
    hit: number;
    coverage: Array<LineCoverage>;
  };
  functions: {
    found: number;
    hit: number;
    coverage: Array<FunctionCoverage>;
  };
  branches: {
    found: number;
    hit: number;
    coverage: Array<BranchCoverage>;
  };
}

export async function parse(path: string) {
  let source: Source = createSource();
  const sources: Array<Source> = [source];
  const file = await Deno.open(path, { read: true });

  for await (const line of readLines(file)) {
    const [type, value] = line.split(":").map((value) => value.trim()) as [
      LCovType,
      string,
    ];

    switch (type) {
      case LCovType.TestName:
        source.name = value;
        break;
      case LCovType.SourceFile:
        source.file = value;
        break;

      case LCovType.FunctionName: {
        const [lineNumber, name] = value.split(",");
        source.functions.coverage.push({
          name,
          line: Number(lineNumber),
          hit: 0,
        });
        break;
      }

      case LCovType.FunctionCoverage: {
        const [hit, name] = value.split(",");
        const fn = source.functions.coverage.find((fn) => fn.name === name);
        if (fn) {
          fn.hit = Number(hit) || 0;
        }
        break;
      }
      case LCovType.BranchCoverage: {
        const [line, block, branch, taken] = value.split(",");
        source.branches.coverage.push({
          line: Number(line) || 0,
          block: Number(block) || 0,
          branch: Number(branch) || 0,
          taken: Number(taken) || 0,
        });
        break;
      }
      case LCovType.LineCoverage: {
        const [line, hit, checksum] = value.split(",");
        source.lines.coverage.push({
          line: Number(line) || 0,
          hit: Number(hit) || 0,
          checksum: checksum,
        });
        break;
      }

      case LCovType.FunctionFound:
        source.functions.found = Number(value) || 0;
        break;
      case LCovType.BranchesFound:
        source.branches.found = Number(value) || 0;
        break;
      case LCovType.LinesFound:
        source.lines.found = Number(value) || 0;
        break;

      case LCovType.FunctionHit:
        source.functions.hit = Number(value) || 0;
        break;
      case LCovType.BranchesHit:
        source.branches.hit = Number(value) || 0;
        break;
      case LCovType.LinesHit:
        source.lines.hit = Number(value) || 0;
        break;

      case LCovType.EndOfRecord:
        source = createSource();
        sources.push(source);
        break;
    }
  }

  if (!sources[0].file) {
    return [];
  }

  return sources;
}

// https://manpages.debian.org/stretch/lcov/geninfo.1.en.html#FILES
enum LCovType {
  /** TN:<test name> */
  TestName = "TN",
  /** SF:<absolute path to the source file> */
  SourceFile = "SF",
  /** FN:<line number of function start>,<function name> */
  FunctionName = "FN",

  /** DA:<line number>,<execution count>[,<checksum>] */
  LineCoverage = "DA",
  /** LF:<number of instrumented lines> */
  LinesFound = "LF",
  /** LH:<number of lines with a non-zero execution count> */
  LinesHit = "LH",

  /** FNDA:<execution count>,<function name> */
  FunctionCoverage = "FNDA",
  /** FNF:<number of functions found> */
  FunctionFound = "FNF",
  /**  FNH:<number of function hit> */
  FunctionHit = "FNH",

  /** BRDA:<line number>,<block number>,<branch number>,<taken> */
  BranchCoverage = "BRDA",
  /** BRF:<number of branches found> */
  BranchesFound = "BRF",
  /**  BRH:<number of branches hit> */
  BranchesHit = "BRH",

  EndOfRecord = "end_of_record",
}

function createSource(): Source {
  return {
    file: "",
    lines: {
      found: 0,
      hit: 0,
      coverage: [],
    },
    functions: {
      found: 0,
      hit: 0,
      coverage: [],
    },
    branches: {
      found: 0,
      hit: 0,
      coverage: [],
    },
  };
}
