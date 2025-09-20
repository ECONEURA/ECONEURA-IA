const { createApp } = require('./app');

const port = process.env.PORT || 3000;
const app = createApp();

if (require.main === module) {
  app.listen(port, () => console.log(`cockpit.api listening on ${port}`));
}

module.exports = app;
