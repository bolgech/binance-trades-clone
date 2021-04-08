module.exports = {
    apps : [{
        script: 'NODE_ENV=production node main.js',
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        time: true,
        name       : "Clone bot",
    }],
}
