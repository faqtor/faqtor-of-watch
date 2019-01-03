import * as faqtor from "faqtor";

export const watch = (...args: faqtor.IFactor[]): faqtor.IFactor => {
    const run = async (): Promise<Error> => {
        // TODO:
        return null;
    }

    return faqtor.func(run);
}
