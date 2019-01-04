import * as faqtor from "faqtor";
import * as chokidar from "chokidar";
import minimatch from "minimatch";
import toAbsGlob from "to-absolute-glob";
import { resolve } from "path";

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

export const watch = (x: faqtor.IFactor | chokidar.WatchOptions, ...tasks: faqtor.IFactor[]): faqtor.IFactor => {
    const isFactor = (y): y is faqtor.IFactor => 
        !!(y as faqtor.IFactor).run &&
        typeof (y as faqtor.IFactor).run === "function";

    let watchOptions: chokidar.WatchOptions = {
        ignoreInitial: true,
        cwd: ".",
    }
    if (isFactor(x)) {
        tasks = [x].concat(tasks);
    } else {
        watchOptions = x;
    }
    const tab: FactorsTab = {};

    const run = async (): Promise<Error> => {
        for (let i = 0; i < tasks.length; i++) {
            const f = tasks[i];
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
                        const e = await f.run();
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
