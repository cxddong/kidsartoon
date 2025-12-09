const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Kidsartoon app is running on Cloud Run!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
