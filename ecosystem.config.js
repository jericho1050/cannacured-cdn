module.exports = {
  apps: [
    {
      name: 'nerimity-cdn',
      script: 'npm',
      args: 'run start',
      watch: true,
      ignore_watch: ['node_modules', 'dist'],
      time: true
    },
  ],
};
