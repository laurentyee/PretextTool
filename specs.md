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

## Tier 1: Core and important features (DONE)

1. Brush tool: Draw something on the canvas and text flows around it dynamically.

2. Scale: Change the scale/size of doodles on the canvas.

3. Drag: Each doodle is draggable and can move around the canvas while text reflows around it.

4. Undo button and clear canvas button.

5. Upon page init, have a popup modal with the instructions (I can write them myself later) that can then be closed. Viewable from help button within toolbar on left of screen.

## Tier 2 (DONE)

Fix bug: flashing (text disappearing for a flash) whenever resizing window

1. Change brush colour: Choose the colour of the brush among a selection of colours.

2. Make a brush that draws rainbow gradients instead of solid colour.

3. Sticker tool: Add a sticker (image) to the canvas. The stickers behave more like stamps, similar to Figjam. Initially, just use one image. Note: stickers are not necessary for first pass proof-of-concept but are more realistic for demo's sake, to add pictures and show how they can scale up and down with text. 

The logic for sticker tool is the same whether or not I use the images in paintings or stickers. The difference is in the user experience and visuals. Implement first using the image starting with "landscape..." inside assets/paintings folder, while coding with variables such that switching to stickers idea will be quick later on.


## Tier 3 (DONE)

1. Change sticker: from prescribed selection of images. Updated the assets/paintings/large folder with the paintings I would like to use. These are larger dimensions so feel free to edit into "derived" folder. Once done, safely delete landscape-sticker and "landscape..." jpg within this folder.

2. Redo button.

## Tier 4

- Initialise text background by justifying the text within the columns. Use pretext to prettify the justification.

1. Change the theme of the background. Implement light mode with a light/dark mode switch on the toolbar.

2. New tool: Change the font for the background text (from list of three options: monospaced, serif and sans-serif. Use PP Editorial for the serif font. Implement variables for scalability such as changing the typeface in the future.)

3. New tool (experiment): "Explode" the text similar to this demo (https://alexanderchen.github.io/typebeat/) but without the sound effects upon the click. What if there was no text bouncing back mechanism?

## Tier 5: Future experimental extensions

1. Other colours/themes for the tool.

2. Add input for user to change the source text.

2. Lasso redraw: if the drawn shape path is closed, change the colour of the text within that shape to the colour of the stroke of the shape. If the shape gets dragged around the canvas, dynamically change the enclosed colour of the text.

3. Select any word within the text. That creates a bounding box around the text which can scale the text up and down. Surrounding text will reshape dynamically. This is to demo how pretext.js fits text to container (https://pretextjs.dev/fit-text-to-container) Idea is similar to lasso redraw but would create different visual effects.

3. Change brush texture: More experimental brush types such as brush using perlin noise texture.
