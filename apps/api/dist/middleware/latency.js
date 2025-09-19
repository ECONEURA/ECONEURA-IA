export function latency() {
    return (req, res, next) => {
        const start = process.hrtime.bigint();
        res.on("finish", () => {
            const end = process.hrtime.bigint();
            const ms = Number(end - start) / 1_000_000;
            if (!res.headersSent && res.getHeader("X-Latency-ms") == null) {
                try {
                    res.setHeader("X-Latency-ms", Math.max(0, Math.round(ms)).toString());
                }
                catch {
                }
            }
        });
        next();
    };
}
//# sourceMappingURL=latency.js.map