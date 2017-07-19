# psdext - photoshop psd file extractor


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

# 2. command line
```
node index.js [psd-filename] [psd-groupname]
```

### The MIT License (MIT)

