import * as faqtor from "faqtor";
import * as chokidar from "chokidar";
import minimatch from "minimatch";
import toAbsGlob from "to-absolute-glob";
import { resolve } from "path";

const debounce = (f: faqtor.IFactor, interval: number): faqtor.IFactor => {
    let lastModif: number = null;
    let tout: any = null;
    const origRun = f.run.bind(f);
    const run = async (argv?: string[]): Promise<Error> => {
        const now = Date.now();
        if (lastModif !== null && now - lastModif >= interval) {
            lastModif = now;
            return await origRun(argv);
        } else {
            lastModif = now;
            return await new Promise<Error>(
                (resolve) => {
                    if (tout !== null) clearTimeout(tout);
                    tout = setTimeout(async () => resolve(await run(argv)), interval);
                }
            );
        }
    }
    f.run = run;
    return f;
}

const norm = (d: faqtor.Domain): string[] => {
    const dom = !d ? [] : typeof d === "string" ? [d] : d;
    if (dom.length < 2) { return dom; }
    const tab: {[name in string]: boolean} = {};
    for (const s of dom) {
        tab[s] = true;
    }
    return Object.getOwnPropertyNames(tab);
};

class ErrorEmptyInput extends Error {
    constructor(pos: number) {
        super(`[watch]: task ${pos} in list of arguments have no input globs`);
    }
}

type FactorsTab = {
    [g in string]: faqtor.IFactor[];
}

const defaultWatchOptions: chokidar.WatchOptions = {
    ignoreInitial: true,
    cwd: ".",
}

export const watch = (tsk: faqtor.IFactor | faqtor.IFactor[], watchOptions: chokidar.WatchOptions = defaultWatchOptions, debounceInterval: number = 500): faqtor.IFactor => {
    const tab: FactorsTab = {};
    let tasks: faqtor.IFactor[];

    if (!Array.isArray(tsk)) {
        tasks = [tsk];
    } else {
        tasks = tsk as faqtor.IFactor[];
    }

    const run = async (argv?: string[]): Promise<Error> => {
        for (let i = 0; i < tasks.length; i++) {
            const f = debounce(tasks[i], debounceInterval);
            const d = norm(f.Input);
            if (!d.length) { return new ErrorEmptyInput(i); }
            for (let g of d) {
                g = toAbsGlob(g);
                if (g in tab) {
                    tab[g].push(f);
                } else {
                    tab[g] = [f];
                }
            }
        }

        const watch = chokidar.watch(Object.getOwnPropertyNames(tab), watchOptions);

        watch.on("all", async (ev, p) => {
            p = resolve(p);
            for (const g in tab) {
                if (minimatch(p, g)) {
                    for (const f of tab[g]) {
                        const e = await f.run(argv);
                        if (e) {
                            console.error(e);
                        }
                    }
                }
            }
        });

        return await new Promise<Error>((resolve) => {
            process.on('SIGINT', () => {
                watch.close();
                resolve(null);
            });
    
            watch.on("error", (e) => {
                watch.close();
                resolve(Error(e));
            })
        })
    }

    return faqtor.func(run);
}
