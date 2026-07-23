Build a scrapbook design tool to demo pretext.js library capabilities (source: https://github.com/chenglou/pretext)

# Suggested stack
pretext.js
React + TypeScript
Tailwind CSS
HTML + Canvas 2D

# Description

A mini design tool as a one-page website. 
On intiation, toolbar on the left side of the screen, and minimal. Paragraph with many words should take up majority of the screen - this is the canvas. Users draw over the text and text reshapes around what users draw.

"Scrapbook" recalls doodling, collaging with crafty and cosy feelings. Balancing an interface that also clearly looking "techy" to point towards the idea that this is what websites of the future could look like. Text rendering that was not possible before could lead to new UI paradigms in a few years, which is the goal of the demo.

## Initial source text (for canvas)

Initial source text is provided in the document "source-text.md" in this repo. Text should appear in initially 1-3 columns, as much text as fits the viewport using 20px of a monospaced font.

### How to treat overflow
Later this is something to consider and make a decision on: Clip overflow text, intentionally provided more text than was necessary to account for different screen sizes and re-rendering.

## Design style
Focus should be on demoing how text is dynamically resized and recalculated using pretext.js. UI of toolbar to be minimalistic. Fonts: use a mix of monospaced font and PP Editorial New (provided in repo). Clean, modern looking, start with dark mode. 

Brushes to be of a contrasting bright colour.

Reflect target audience: designers and creative front-end developers.

## Inspiration
https://notwk.london/ 
https://spacetypegenerator.com/
https://www.aspektedesrasters.de/
https://danqiqian321.github.io/pretext/ (animation tool using pretext)
https://chenglou.me/pretext/ (mini demo tools for pretext.js by the developer)

# Features

Tiered in order of importance. This is the current planned sequence of implementation. Implementation plan is open to changing as we go. Test early and often, focus on each increment at the time while preparing for scalability into next tiers of features. Think about responsiveness, need working version mobile around Tier 3/4.

## Tier 1: Core and important features

1. Brush tool: Draw something on the canvas and text flows around it dynamically.

2. Scale: Change the scale/size of doodles on the canvas.

3. Drag: Each doodle is draggable and can move around the canvas while text reflows around it.

4. Undo button and clear canvas button.

5. Upon page init, have a popup modal with the instructions (I can write them myself later) that can then be closed. Viewable from help button within toolbar on left of screen.

## Tier 2
1. Sticker tool: Add a sticker (image) to the canvas. The stickers behave more like stamps, similar to Figjam. Initially, just use one image. Note: stickers are not necessary for first pass proof-of-concept but are more realistic for demo's sake, to add pictures and show how they can scale up and down with text. 

2. Redo button.

3. Scale text background up and down. Text should still dynamically resize around the doodles.

## Tier 3: important for "design sensibility"

1. Change brush colour: Choose the colour of the brush among a selection of colours.

2. Make more interesting brushes such as a brush that draws rainbow gradients instead of solid colour.

3. Change sticker: from prescribed selection of images.

## Tier 4: Nice to have

1. Change the theme of the background. Implement light mode and other colours/images themes.

2. Add input for user to change the source text.

## Tier 5: Future experimental extensions

1. Lasso redraw: if the drawn shape path is closed, change the colour of the text within that shape to the colour of the stroke of the shape. If the shape gets dragged around the canvas, dynamically change the enclosed colour of the text.

2. Select any word within the text. That creates a bounding box around the text which can scale the text up and down. Surrounding text will reshape dynamically. This is to demo how pretext.js fits text to container (https://pretextjs.dev/fit-text-to-container) Idea is similar to lasso redraw but would create different visual effects.

3. Change brush texture: More experimental brush types such as brush using perlin noise texture.

# Where to start

Start by first creating project with proper folder and file structure. 