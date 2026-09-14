export type GuideBlock = {
  heading: string;
  body: string;
  effect?: string;
};

export type GuideChapter = {
  id: string;
  title: string;
  blocks: GuideBlock[];
};

/** In-app admin manual — keep wording matched to real button labels */
export const ADMIN_GUIDE_CHAPTERS: GuideChapter[] = [
  {
    id: "start",
    title: "Start here",
    blocks: [
      {
        heading: "Open Help any time",
        body: "Click Help in the top bar. The first-visit banner also has Open help. More → Help opens this same panel. Full page at the top of the panel opens a readable copy you can keep in another tab.",
        effect: "Nothing on the live site changes when you open Help.",
      },
      {
        heading: "What this editor is",
        body: "You are editing the live website, but changes stay on your screen until you click Save changes. Visitors still see the last saved version.",
        effect: "Yellow “Not saved yet” means the public site has not been updated.",
      },
      {
        heading: "Open a page",
        body: "Use Page in the top bar to pick Homepage, About, Products, and so on. That loads that page’s blocks for editing.",
        effect: "Switching pages without saving drops unsaved edits on the page you left.",
      },
      {
        heading: "See what visitors see",
        body: "More → View live page opens the public page in a new tab. After you save, refresh that tab.",
        effect: "The live tab does not update by itself — refresh it after Save.",
      },
    ],
  },
  {
    id: "text",
    title: "Edit text",
    blocks: [
      {
        heading: "Click to type",
        body: "Click any heading or paragraph. A dashed outline means it is editable. Type, then click outside the text to keep it.",
        effect: "The words change on this screen only. Click Save changes to publish them.",
      },
      {
        heading: "Longer notes",
        body: "Some blocks have a “Footer note under this section” field (for example under a specs table). That line shows under the block on the live page.",
        effect: "Leave it empty if you do not want a footnote.",
      },
    ],
  },
  {
    id: "photos",
    title: "Photos and logos",
    blocks: [
      {
        heading: "Change a photo",
        body: "On a picture, use Change photo to upload a new file. The old file is replaced in that slot.",
        effect: "The new image appears in the editor immediately; Save publishes it.",
      },
      {
        heading: "Drag to reframe",
        body: "On most photos you can click and drag to choose which part stays in the frame. Scroll or use zoom if the control is shown.",
        effect: "This crops the view, it does not stretch the file. Useful when a photo is off-centre.",
      },
      {
        heading: "Photo shape",
        body: "Wide / Landscape / Square / Tall sets the frame ratio for that block. Photos fill the frame; mixed sizes will crop.",
        effect: "Pick Square for even card rows; Wide for banners.",
      },
      {
        heading: "Gallery layout",
        body: "Grid = photo tiles. Slideshow = rotating photos. Logos = certification marks that sit in a tile without being cropped like a photo. Pages = full document pages shown whole.",
        effect: "If a logo looks cut off or stuck in a corner, switch that gallery to Logos.",
      },
      {
        heading: "Photo position (logos)",
        body: "In Logos mode, the 3×3 pad sets where the mark sits in the tile: middle, left, right, or a corner.",
        effect: "Middle centres ISO / SIRIM / Bomba. Left or right if a mark has extra empty space on one side.",
      },
    ],
  },
  {
    id: "blocks",
    title: "Blocks on a page",
    blocks: [
      {
        heading: "A page is a stack of blocks",
        body: "Each band of content (banner, text, cards, table, contact box) is a block. Order on screen is top to bottom.",
        effect: "↑ Up / ↓ Down in the dark bar under a block moves it on the live page after you save.",
      },
      {
        heading: "Add a block",
        body: "Use + Add a block here (or at the top / bottom). Choose a type from the list. Everyday types show first; More options hides tables, tabs, and joint diagrams.",
        effect: "The new block is inserted at that spot. Fill it in, then Save.",
      },
      {
        heading: "Duplicate",
        body: "Copies the whole block, including photos and text, and places the copy underneath.",
        effect: "Handy when two sections should look the same except for the words.",
      },
      {
        heading: "Remove",
        body: "Deletes that block from the page after you confirm. This is not undoable after Save, though Undo works before you save (Ctrl+Z).",
        effect: "Visitors lose that section only after Save.",
      },
      {
        heading: "1 / 2 / 3 across",
        body: "On cards, galleries, and some lists, this sets how many items sit in a row on a wide screen.",
        effect: "3 across is typical for certification marks. 2 across for larger photo cards.",
      },
    ],
  },
  {
    id: "types",
    title: "What each block type is for",
    blocks: [
      {
        heading: "Page banner",
        body: "The large top of a page: brand line, headline, and optional background photo.",
        effect: "First thing visitors see. Keep the headline short.",
      },
      {
        heading: "Key highlights",
        body: "Numbered points (01, 02, 03) in a row.",
        effect: "Use for three proof points, not a long story.",
      },
      {
        heading: "Heading & text",
        body: "A title and a paragraph. Simple writing block.",
      },
      {
        heading: "Text with photo",
        body: "Title and text beside one photo, or a slideshow. Layout switches photo left or text left.",
        effect: "Photo left · Text right swaps the columns.",
      },
      {
        heading: "Cards / links",
        body: "Tiles with photo, title, short text, and a link. Card style can be normal photos or Cert / logo cards.",
        effect: "Use Cert / logo cards for ISO, SIRIM, FM, TÜV so marks stay sharp.",
      },
      {
        heading: "List + photo slideshow",
        body: "Bullet list next to rotating photos (Applications on a product page).",
      },
      {
        heading: "Label–value list",
        body: "Rows such as Thickness → 100 mm. Product specifications.",
      },
      {
        heading: "Table",
        body: "Spreadsheet-style grid (property, test method, result). Add columns and rows as needed.",
      },
      {
        heading: "Photo gallery",
        body: "A row of images. Switch Grid / Slideshow / Logos / Pages as above.",
      },
      {
        heading: "Expandable joint details",
        body: "Collapsed diagrams visitors open. Add extra diagram pages inside it.",
      },
      {
        heading: "Contact box",
        body: "Email, phone, WhatsApp, or any label + value, plus a button to Contact.",
      },
      {
        heading: "Highlight note",
        body: "One important sentence in a standout box.",
      },
      {
        heading: "Number stats",
        body: "Big figures with short labels (year established, location).",
      },
      {
        heading: "Tabbed sections",
        body: "Several inner pages in one block (tabs). Each tab can hold its own blocks.",
        effect: "Use when one topic has clearly separate slices (for example Overview vs Specs).",
      },
    ],
  },
  {
    id: "buttons",
    title: "Buttons on a block",
    blocks: [
      {
        heading: "Add a button",
        body: "Some blocks allow buttons underneath. Set the label, then where it goes: another page, a section on this page, email, or a web address.",
        effect: "Primary is the filled orange button; Ghost is the outline. Visitors click through after you save.",
      },
      {
        heading: "Go to a section",
        body: "Jump targets are named from the blocks already on this page (for example Specifications).",
        effect: "The page scrolls to that block. If you later remove the block, the jump will have nowhere to go.",
      },
    ],
  },
  {
    id: "save",
    title: "Save, undo, and safety",
    blocks: [
      {
        heading: "Save changes",
        body: "Writes this page to the server. That is the version the public website uses.",
        effect: "The “Not saved yet” warning clears. Open View live page and refresh to confirm.",
      },
      {
        heading: "Undo / Redo",
        body: "More → Undo, or Ctrl+Z (Cmd+Z on Mac). Redo is Ctrl+Y or Shift+Ctrl+Z.",
        effect: "Steps back through edits on this page in this session. After a full reload, that history is gone.",
      },
      {
        heading: "Leaving the page",
        body: "The browser will warn you if you close the tab with unsaved work.",
        effect: "If you ignore the warning, those edits are lost.",
      },
    ],
  },
  {
    id: "menu",
    title: "Website menu",
    blocks: [
      {
        heading: "Edit website menu",
        body: "More → Edit website menu (or /admin/nav). That is the top bar visitors use: Home, About, Products, and so on.",
        effect: "Changing a label or link here does not change the page content — only where the menu points.",
      },
      {
        heading: "Create a new empty page",
        body: "On the menu screen, give a title and a section (About / Products / Other), then Create empty page. It is added to the menu list. Save menu, then open that page in the editor and add blocks.",
        effect: "Until you add content and save the page, visitors see a placeholder.",
      },
      {
        heading: "Sub-links",
        body: "A main item can have dropdown children (About → Company Profile). Add a sub-link, pick the page, then Save menu.",
        effect: "The dropdown appears in the public header after save.",
      },
    ],
  },
];
