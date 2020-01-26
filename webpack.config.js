const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'main.js',
        chunkFilename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    mode: 'development',
    devServer: {
        contentBase: [path.join(__dirname, 'dist'), path.join(__dirname, 'src')],
        port: 8080
    },
    watch: true,

    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: {
                    chunks: 'all',
                    test: /node_modules/
                }
            }
        }
    }
};