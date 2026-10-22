/**
 * Character cards added from Ashton's list.
 * Titles are the written name, or the rename in parentheses.
 * Detail stays empty: no extra rules line, and no "describe your version" prompt.
 * Exact duplicates of cards already in a deck are omitted.
 */
type Addition = readonly [id: string, title: string, detail: ''];

export const houseCharacterAdditions = [
  ['abraham-lincoln', 'Abraham Lincoln', ''],
  ['pick-comic', 'Pick a Comic Book Character', ''],
  ['velociraptor', 'Velociraptor', ''],
  ['t-rex', 'T-Rex', ''],
  ['pterodactyl', 'Pterodactyl', ''],
  ['saber-tooth', 'Saber-Toothed Tiger', ''],
  ['mammoth', 'Woolly Mammoth', ''],
  ['spartan', 'Spartan', ''],
  ['octopus', 'Octopus', ''],
  ['the-dude', 'The Dude', ''],
  ['chemistry-teacher', 'Chemistry Teacher Gone Bad', ''],
  ['snake', 'Snake', ''],
  ['bull', 'Bull', ''],
  ['sherlock', 'Sherlock Holmes', ''],
  ['heavyweight', 'Ear-Biting Heavyweight Champ', ''],
  ['bodybuilder', 'Bodybuilder', ''],
  ['pope', 'The Pope', ''],
  ['playboy', 'Billionaire Playboy', ''],
  ['diva', 'Domestic Diva', ''],
  ['shark', 'Shark', ''],
  ['heartthrob', 'Teen Pop Heartthrob', ''],
  ['supermodel', 'Supermodel', ''],
  ['secret-agent', 'Secret Agent', ''],
  ['gymnast', 'Olympic Gymnast', ''],
  ['k-pop', 'K-Pop Star', ''],
  ['cheetah', 'Cheetah', ''],
  ['eagle', 'Eagle', ''],
  ['whale', 'Whale', ''],
  ['polar-bear', 'Polar Bear', ''],
  ['chocolates', 'Box-of-Chocolates Runner', ''],
  ['eel', 'Electric Eel', ''],
  ['penguin', 'Emperor Penguin', ''],
  ['squid', 'Giant Squid', ''],
  ['gladiator', 'Gladiator', ''],
  ['duct-tape', 'Duct Tape Genius', ''],
  ['french-bulldog', 'French Bulldog', ''],
  ['chimpanzee', 'Chimpanzee', ''],
  ['moose', 'Moose', ''],
  ['sharpshooter', 'Sharpshooter', ''],
  ['sloth', 'Sloth', ''],
  ['giraffe', 'Giraffe', ''],
  ['counterterror', '24-Hour Counterterror Agent', ''],
  ['me', 'Me', ''],
  ['hippo', 'Hippo', ''],
  ['candy-tycoon', 'Eccentric Candy Tycoon', ''],
  ['gandhi', 'Gandhi', ''],
  ['physicist', 'Genius Physicist', ''],
  ['rock-opera', 'Rock Opera Legend', ''],
  ['croc-wrangler', 'Croc Wrangler', ''],
  ['pop-star', 'Wrecking Ball Pop Star', ''],
  ['one-man-army', 'One-Man Army', ''],
  ['genghis', 'Genghis Khan', ''],
  ['former-president', 'Former President', ''],
  ['owl', 'Owl', ''],
  ['king-of-pop', 'King of Pop', ''],
  ['lucha', 'Lucha Libre Wrestler', ''],
  ['rhino', 'Rhinoceros', ''],
  ['cool-president', 'Cool Former President', ''],
  ['cat', 'Cat', ''],
  ['rebel-archer', 'Teen Rebel Archer', ''],
  ['ufc', 'Ultimate Fighting Champion', ''],
  ['gorilla', 'Gorilla', ''],
  ['cartoon-dad', 'Donut-Loving Cartoon Dad', ''],
  ['pick-action', 'Pick an Action Movie Star', ''],
  ['spider', 'Spider', ''],
  ['billionaire-president', 'Billionaire President', ''],
  ['pick-tv', 'Pick a TV Character', ''],
  ['turtle', 'Turtle', ''],
  ['plumbers', 'Plumber Brothers', ''],
  ['pick-celebrity', 'Pick a Celebrity', ''],
  ['assassin', 'Assassin', ''],
  ['candidate', 'Presidential Candidate', ''],
  ['apache', 'Apache Warrior', ''],
  ['dolphin', 'Dolphin', ''],
  ['hockey', 'Hockey Player', ''],
  ['femme-fatale', 'Femme Fatale', ''],
  ['rage-monster', 'Big Green Rage Monster', ''],
  ['mafia-don', 'Mafia Don', ''],
  ['player-left', 'The Player to Your Left', ''],
  ['sumo', 'Sumo Wrestler', ''],
  ['pick-movie', 'Pick a Movie Character', ''],
  ['helen-keller', 'Helen Keller', ''],
  ['psychic', 'Psychic', ''],
] as const satisfies readonly Addition[];

export const fantasyCharacterAdditions = [
  ['leprechaun', 'Leprechaun', ''],
  ['musketeer', 'Musketeer', ''],
  ['mermaid', 'Mermaid', ''],
  ['unicorn', 'Unicorn', ''],
  ['samurai', 'Samurai', ''],
  ['barbarian', 'Barbarian Warrior', ''],
  ['witch', 'Witch', ''],
  ['robin-hood', 'Robin Hood', ''],
  ['wizard-student', 'Know-It-All Wizard Student', ''],
  ['angel', 'Angel', ''],
  ['viking', 'Viking', ''],
  ['queen', 'Queen', ''],
] as const satisfies readonly Addition[];

export const scifiCharacterAdditions = [
  ['mad-scientist', 'Mad Scientist', ''],
  ['cyborg', 'Time-Traveling Cyborg', ''],
  ['alien-doctor', 'Time-Traveling Alien Doctor', ''],
  ['lost-alien', 'Lost Little Alien', ''],
  ['alien-hunters', 'Alien-Hunting Agents', ''],
  ['armored-genius', 'Armored Billionaire Genius', ''],
] as const satisfies readonly Addition[];

export const horrorCharacterAdditions = [
  ['serial-killer', 'Friendly Neighborhood Serial Killer', ''],
  ['blob', 'Blob', ''],
  ['skeleton', 'Skeleton', ''],
  ['evil-doll', 'Evil Doll', ''],
  ['slayer', 'Vampire Slayer', ''],
  ['cannibal', 'Cannibal Psychiatrist', ''],
  ['sasquatch', 'Sasquatch', ''],
  ['possessed-car', 'Demon-Possessed Car', ''],
  ['killer-bees', 'Swarm of Killer Bees', ''],
  ['smoke', 'Smoke Monster', ''],
  ['devil', 'The Devil', ''],
  ['reaper', 'Grim Reaper', ''],
  ['dream-slasher', 'Dream Slasher', ''],
  ['hunchback', 'Hunchback', ''],
  ['hockey-mask', 'Hockey-Mask Slasher', ''],
  ['demon', 'Demon', ''],
] as const satisfies readonly Addition[];

export const animeCharacterAdditions = [
  ['street-fighter', 'Street Fighter', ''],
] as const satisfies readonly Addition[];

export const everydayCharacterAdditions = [
  ['vegan', 'Vegan', ''],
  ['hipster', 'Hipster', ''],
  ['marching-band', 'High School Marching Band', ''],
  ['pageant', 'Child Beauty Pageant Queen', ''],
  ['bowling', 'Senior Citizen Bowling Team', ''],
  ['significant-other', 'My Significant Other', ''],
  ['acappella', 'College A Cappella Group', ''],
  ['boss', 'My Boss', ''],
  ['cat-lady', 'Crazy Cat Lady', ''],
  ['nudist', 'Nudist', ''],
  ['redneck', 'Redneck', ''],
  ['kindergarten', 'Kindergarten Class', ''],
  ['sweater-neighbor', 'Kindly Sweater Neighbor', ''],
  ['your-mom', 'Your Mom', ''],
  ['ex', 'My Ex', ''],
  ['hobo', 'Hobo', ''],
  ['boy-scout', 'Boy Scout', ''],
  ['girl-scout', 'Girl Scout', ''],
  ['twins', 'Identical Twins', ''],
  ['mime', 'Mime', ''],
] as const satisfies readonly Addition[];

export const housePowerAdditions = [
  ['flamethrower', 'Armed with a flamethrower', ''],
  ['sniper', 'Armed with a sniper rifle', ''],
  ['winds', 'Can blow 200-mph winds', ''],
  ['underwater', 'Can breathe underwater', ''],
  ['any-animal', 'Can become any animal', ''],
  ['teleports', 'Teleports', ''],
  ['magnetism', 'Controls magnetism', ''],
  ['xray', 'X-ray vision', ''],
  ['sonic', 'Sonic scream', ''],
  ['impact', 'Unaffected by impact', ''],
] as const satisfies readonly Addition[];

export const fantasyPowerAdditions = [
  ['holy-grenades', 'Armed with holy hand grenades', ''],
  ['breathes-fire', 'Breathes fire', ''],
  ['berserker', 'Berserker rage', ''],
  ['centaur', 'Riding a depressed centaur', ''],
] as const satisfies readonly Addition[];

export const scifiPowerAdditions = [
  ['shrink-ray', 'Armed with a shrink ray', ''],
  ['jet-pack', 'Wearing a jet-pack', ''],
] as const satisfies readonly Addition[];

export const horrorPowerAdditions = [
  ['mist', 'Can become mist while holding breath', ''],
] as const satisfies readonly Addition[];

export const everydayPowerAdditions = [
  ['shampoo', 'Has shampoo in eyes', ''],
  ['cries', 'Cries uncontrollably', ''],
] as const satisfies readonly Addition[];

export const absurdPowerAdditions = [
  ['shotgun-shotguns', 'Armed with a shotgun that shoots shotguns', ''],
  ['superglue', 'Armed with a superglue fire hose', ''],
  ['sausage', 'Armed with an infinite sausage lasso', ''],
  ['shark-cage', 'Locked in a shark cage', ''],
  ['guacamole', 'Made of guacamole', ''],
  ['believes-invisible', 'Believes they are invisible', ''],
  ['stupid', 'Really stupid', ''],
  ['no-bones', 'No bones', ''],
  ['molasses', 'Flying at the speed of molasses', ''],
  ['unicycle-half', 'Bottom half is a unicycle', ''],
  ['kazoo', 'Constantly playing a kazoo', ''],
] as const satisfies readonly Addition[];

export const absurdCharacterAdditions = [
  ['reggae', 'Reggae Band', ''],
  ['carnie', 'Carnie', ''],
  ['canada', 'Canada', ''],
  ['search-engine', 'The Search Engine', ''],
  ['purple-dinosaur', 'Purple Dinosaur', ''],
  ['pet-rock', 'Pet Rock', ''],
  ['cactus', 'Cactus', ''],
  ['illuminati', 'The Illuminati', ''],
  ['boy-band', 'Boy Band', ''],
  ['head', 'Disembodied Head', ''],
  ['clown-posse', 'Literally Insane Clown Posse', ''],
  ['prince', 'Nigerian Prince', ''],
  ['fainting-goat', 'Fainting Goat', ''],
  ['burning-man', 'Everyone at Burning Man', ''],
  ['lineup', 'Music Festival Lineup', ''],
  ['liberty', 'The Statue of Liberty', ''],
  ['puppies', '101 Spotted Puppies', ''],
  ['un', 'The U.N.', ''],
  ['marshmallow', 'Giant Marshmallow Man', ''],
  ['reality-tv', 'Reality TV Family', ''],
] as const satisfies readonly Addition[];
