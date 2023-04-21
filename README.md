# Scatter

![banner](banner.png)

A WebGL tool to display output from scattering simulations

A live version is available [here](https://ageller.github.io/Scatter_WebGL/).

## Uploading your own data

The live version linked above can read in your data by dragging and dropping a .csv file into the browser window.  The .csv format must have columns of :

```ID,time,x,y,z```

(The first row of the file must have those columns labeled.  Other columns are OK but will be ignored.)  Each particle gets it's own row during each time step (so you will have repeated values of time).  An example csv file is provided in the ```data``` directory.


## Keyboard Shortcuts
*Note: I have noticed some strange behavior with my bluetooth keyboard not sending combined key presses in certain instances, e.g. when wanting "T" + "right" + "up"*

- SPACE: play/pause
- hold "T" + left/right arrow keys: moves time forward/backwards by one itme step
- hold "T" + up/down : change the time step factor to accelerate/decelerate the time evolution
- hold "A" + up/down/left/right : rotate the camera
- hold "S" + up/down : zoom the camera
- hold "D" + up/down/left/right : pan the camera

## Running on your local machine

If you want to run this locally (e.g., so that you can avoid the drag-and-drop feature and load your file by default), first, clone/download this repo to your computer.  Navigate to the directory where the index.html file from this repo lives, and launch a simple Python server:

```python -m http.server```

Then you can point your browser to the url ```http://localhost:8000```.  

You can replace the data in the ```data``` with your own (following the format specified above).  

Also, if you prefer to work fully in a Jupyter notebook, you can follow the example in [ScatterVisNewData.ipynb](ScatterVisNewData.ipynb).

