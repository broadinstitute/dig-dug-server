const app = require('express');

const yaml = require('yaml');


app.get('/', (req, res) => {
    res.send('dig dug portal');
});

app.listen(8090);
