module.exports = function(grunt) {

// Project configuration.
grunt.initConfig({
  pkg: grunt.file.readJSON('package.json'),
    lint: {
        all:['js/*.js']
    },
    reload: {
        port: 3000,
        proxy: {
            host: 'localhost'
        }
    },
    watch:{
        files:['index.ejs', 'style.css', 'form.ejs', 'thankYou.ejs'],
        tasks:'default reload'
    }
});

grunt.loadNpmTasks('grunt-reload');
grunt.loadNpmTasks('grunt-contrib-watch');

// Default task(s).
grunt.registerTask('default', ['reload']);

};