const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function (app) {
    console.log("Proxy setup running...",process.env.NODE_ENV);
    if (process.env.NODE_ENV == "development") {
        app.use(
            "/api",
            createProxyMiddleware({
            target: "http://127.0.0.1:5077",
            changeOrigin: true,
            // pathRewrite: {
            //     "^/api": "",
            // },
            })
        );
    }
};