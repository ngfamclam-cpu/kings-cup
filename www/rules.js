// Default King's Cup rules. Players can override any of these in House Rules;
// overrides are saved on the device (see app.js).
//
// role:    drawing this card makes the drawer hold a role until the next one is drawn.
// newRule: drawing this card prompts for a new table rule to show on screen.
const DEFAULT_RULES = {
  A:  { title: "Waterfall",  text: "Everyone starts drinking at once. Nobody can stop until the person to their right stops. The person who drew goes first." },
  2:  { title: "You",        text: "Pick someone to drink." },
  3:  { title: "Me",         text: "You drink." },
  4:  { title: "Floor",      text: "Everyone touches the floor. Last one down drinks." },
  5:  { title: "Guys",       text: "All the guys drink." },
  6:  { title: "Girls",      text: "All the girls drink." },
  7:  { title: "Heaven",     text: "Everyone points to the sky. Last one to point drinks." },
  8:  { title: "Mate",       text: "Pick a mate. Every time you drink, they drink too, for the rest of the game." },
  9:  { title: "Rhyme",      text: "Say a word. Going around, everyone says a word that rhymes. First to repeat or stall drinks." },
  10: { title: "Categories", text: "Pick a category (car brands, beers...). Going around, name something in it. First to repeat or stall drinks." },
  J:  { title: "Make a Rule", text: "Make a rule everyone has to follow for the rest of the game. Break it, drink.", newRule: true },
  Q:  { title: "Question Master", text: "You're the Question Master until the next Queen. Anyone who answers a question you ask drinks.", role: "Question Master" },
  K:  { title: "King's Cup", text: "Pour some of your drink into the King's Cup. Whoever draws the 4th King drinks the whole cup." },
};

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = [
  { key: "S", symbol: "♠", red: false },
  { key: "H", symbol: "♥", red: true },
  { key: "D", symbol: "♦", red: true },
  { key: "C", symbol: "♣", red: false },
];
