

#psdext : .PSD extractor


# require 
require npm psd module

```
npm install --save psd
```



# 1. how to use

```
let psdext = require('./psdext.js');
let p = new psdext();
p.loadFile("my.psd");
// extract photoshop layer group "my_group"
p.extractText('my_group');
```

### The MIT License (MIT)

