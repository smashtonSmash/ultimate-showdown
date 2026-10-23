/**
 * Character cards added from Ashton's list.
 * Titles are the written name, or the rename in parentheses.
 * Each card gets one short flavor line, and no extra rules.
 * Exact duplicates of cards already in a deck are omitted.
 */
type Addition = readonly [id: string, title: string, detail: string];

export const houseCharacterAdditions = [
  ['abraham-lincoln', 'Abraham Lincoln', 'The hat is tall. The speech is taller.'],
  ['pick-comic', 'Pick a Comic Book Character', 'You name the hero. The cape is already implied.'],
  ['velociraptor', 'Velociraptor', 'Opens the door, then holds a grudge about it.'],
  ['t-rex', 'T-Rex', 'Tiny arms. Enormous opinions.'],
  ['pterodactyl', 'Pterodactyl', 'Screams from overhead, then asks for a snack.'],
  ['saber-tooth', 'Saber-Toothed Tiger', 'The smile arrives before the rest of them.'],
  ['mammoth', 'Woolly Mammoth', 'Remembers every winter, and brings it up.'],
  ['spartan', 'Spartan', 'A shield, a speech, and very little else.'],
  ['octopus', 'Octopus', 'A plan for each arm, plus one spare.'],
  ['the-dude', 'The Dude', 'The robe is a lifestyle. The agenda is blank.'],
  ['chemistry-teacher', 'Chemistry Teacher Gone Bad', 'The apron is clean. The plan is not.'],
  ['snake', 'Snake', 'No legs, no hurry, and no mercy.'],
  ['bull', 'Bull', 'Sees red. Treats everything else as optional.'],
  ['sherlock', 'Sherlock Holmes', 'Already noticed the thing you are hiding.'],
  ['heavyweight', 'Ear-Biting Heavyweight Champ', 'Leads with the ears. Leaves with the belt.'],
  ['bodybuilder', 'Bodybuilder', 'Flexes as a form of punctuation.'],
  ['pope', 'The Pope', 'Blesses the room, then asks who is keeping score.'],
  ['playboy', 'Billionaire Playboy', 'Arrives late, in a better car than the point.'],
  ['diva', 'Domestic Diva', 'The centerpiece is perfect. You are in the way.'],
  ['shark', 'Shark', 'Smiles with too many teeth and no appointment.'],
  ['heartthrob', 'Teen Pop Heartthrob', 'The scream shows up a second before the song.'],
  ['supermodel', 'Supermodel', 'Walks like the floor applied for the job.'],
  ['secret-agent', 'Secret Agent', 'The name is whatever you just forgot.'],
  ['gymnast', 'Olympic Gymnast', 'Sticks the landing. The landing files a complaint.'],
  ['k-pop', 'K-Pop Star', 'The chorus has choreography. So does the threat.'],
  ['cheetah', 'Cheetah', 'Fast enough to regret the destination.'],
  ['eagle', 'Eagle', 'Eyesight like a grudge that never blinks.'],
  ['whale', 'Whale', 'Sings one note and rearranges the furniture.'],
  ['polar-bear', 'Polar Bear', 'White, hungry, and unimpressed by your coat.'],
  ['chocolates', 'Box-of-Chocolates Runner', 'Runs because someone called life a sampler.'],
  ['eel', 'Electric Eel', 'The handshake is a mistake you make once.'],
  ['penguin', 'Emperor Penguin', 'Formalwear, and zero interest in flying.'],
  ['squid', 'Giant Squid', 'More arms than the argument has points.'],
  ['gladiator', 'Gladiator', 'The crowd is imaginary. The pose is not.'],
  ['duct-tape', 'Duct Tape Genius', 'Fixes the chair, the plan, and the alibi.'],
  ['french-bulldog', 'French Bulldog', 'Breathes like a tiny engine with opinions.'],
  ['chimpanzee', 'Chimpanzee', 'Throws the first thought that comes to hand.'],
  ['moose', 'Moose', 'Antlers wide enough to edit the hallway.'],
  ['sharpshooter', 'Sharpshooter', 'Hits the target. The target had a speech ready.'],
  ['sloth', 'Sloth', 'Will get there. The fight may already be over.'],
  ['giraffe', 'Giraffe', 'Sees the plan from a floor you do not have.'],
  ['counterterror', '24-Hour Counterterror Agent', 'The clock is loud. The whisper is louder.'],
  ['me', 'Me', 'You, but with a soundtrack and worse judgment.'],
  ['hippo', 'Hippo', 'Mostly mouth. The rest is commitment.'],
  ['candy-tycoon', 'Eccentric Candy Tycoon', 'The tour is golden. The exit is a riddle.'],
  ['gandhi', 'Gandhi', 'Wins by refusing to swing, which is infuriating.'],
  ['physicist', 'Genius Physicist', 'Explains the universe, then asks for the ramp.'],
  ['rock-opera', 'Rock Opera Legend', 'Every entrance gets its own key change.'],
  ['croc-wrangler', 'Croc Wrangler', 'Talks to the jaws. The jaws talk back.'],
  ['pop-star', 'Wrecking Ball Pop Star', 'Swings in, wrecks the chorus, swings out.'],
  ['one-man-army', 'One-Man Army', 'The headband is the whole chain of command.'],
  ['genghis', 'Genghis Khan', 'The horde is running late. He is not.'],
  ['former-president', 'Former President', 'Still practices the speech in the mirror.'],
  ['owl', 'Owl', 'Turns its head all the way around the excuse.'],
  ['king-of-pop', 'King of Pop', 'One glove on. The other hand is the plot.'],
  ['lucha', 'Lucha Libre Wrestler', 'The mask stays on. Dignity is optional.'],
  ['rhino', 'Rhinoceros', 'Charges first. Asks what the room was later.'],
  ['cool-president', 'Cool Former President', 'The jacket is off. The point is not.'],
  ['cat', 'Cat', 'Knocks the plan off the table, then sits in it.'],
  ['rebel-archer', 'Teen Rebel Archer', 'Raises a hand. The arena takes notes.'],
  ['ufc', 'Ultimate Fighting Champion', 'The cage is a suggestion with a referee.'],
  ['gorilla', 'Gorilla', 'Beats the chest. The chest files a complaint.'],
  ['cartoon-dad', 'Donut-Loving Cartoon Dad', 'The donut is a lifestyle. The yell is grammar.'],
  ['pick-action', 'Pick an Action Movie Star', 'You name the star. The explosion is complimentary.'],
  ['spider', 'Spider', 'Eight legs, one web, and no patience for flies.'],
  ['billionaire-president', 'Billionaire President', 'The tie is long. The grudge is longer.'],
  ['pick-tv', 'Pick a TV Character', 'You name the show. The laugh track gets nervous.'],
  ['turtle', 'Turtle', 'Wins by still being there when you get tired.'],
  ['plumbers', 'Plumber Brothers', 'Two brothers, one overalls budget, many pipes.'],
  ['pick-celebrity', 'Pick a Celebrity', 'You name them. They were already on the way.'],
  ['assassin', 'Assassin', 'The contract is short. The silence is shorter.'],
  ['candidate', 'Presidential Candidate', 'Shakes every hand, including the one that objects.'],
  ['apache', 'Apache Warrior', 'Reads the ground the way other people read rooms.'],
  ['dolphin', 'Dolphin', 'Smiles, clicks, and is clearly up to something.'],
  ['hockey', 'Hockey Player', 'The teeth are optional. The check is not.'],
  ['femme-fatale', 'Femme Fatale', 'The lighter talks. You do the regretting.'],
  ['rage-monster', 'Big Green Rage Monster', 'Big, green, and finished with the sentence.'],
  ['mafia-don', 'Mafia Don', 'The offer arrives in a very calm voice.'],
  ['player-left', 'The Player to Your Left', 'They did not volunteer. They are in it anyway.'],
  ['sumo', 'Sumo Wrestler', 'The ring is small. The presence is not.'],
  ['pick-movie', 'Pick a Movie Character', 'You name the picture. The credits look nervous.'],
  ['helen-keller', 'Helen Keller', 'Misses nothing that matters, including your tell.'],
  ['psychic', 'Psychic', 'Already spoiled the ending. You are living it.'],
] as const satisfies readonly Addition[];

export const fantasyCharacterAdditions = [
  ['leprechaun', 'Leprechaun', 'The gold is a rumor with excellent shoes.'],
  ['musketeer', 'Musketeer', 'All for one, and that one is keeping score.'],
  ['mermaid', 'Mermaid', 'The song is pretty. The tide is the point.'],
  ['unicorn', 'Unicorn', 'Rare, glittering, and judging your shoes.'],
  ['samurai', 'Samurai', 'The bow takes longer than the cut.'],
  ['barbarian', 'Barbarian Warrior', 'The loincloth is the entire strategic plan.'],
  ['witch', 'Witch', 'The cauldron knows your name, and it is cackling.'],
  ['robin-hood', 'Robin Hood', 'Rob the rich. Leave a very neat receipt.'],
  ['wizard-student', 'Know-It-All Wizard Student', 'Hand is up. So is the spell. Dangerously.'],
  ['angel', 'Angel', 'The halo is slightly crooked, on purpose.'],
  ['viking', 'Viking', 'The boat is a mood. The axe is a period.'],
  ['queen', 'Queen', 'Off with the argument. She has a schedule.'],
] as const satisfies readonly Addition[];

export const scifiCharacterAdditions = [
  ['mad-scientist', 'Mad Scientist', 'The laugh is practiced. The switch is not.'],
  ['cyborg', 'Time-Traveling Cyborg', 'Came from later, with a shorter temper.'],
  ['alien-doctor', 'Time-Traveling Alien Doctor', 'The ship is a box with opinions about time.'],
  ['lost-alien', 'Lost Little Alien', 'Wants to call home. The finger does the dialing.'],
  ['alien-hunters', 'Alien-Hunting Agents', 'Suits, shades, and one very bright flashlight.'],
  ['armored-genius', 'Armored Billionaire Genius', 'The suit does the flying. The mouth does the rest.'],
] as const satisfies readonly Addition[];

export const horrorCharacterAdditions = [
  ['serial-killer', 'Friendly Neighborhood Serial Killer', 'Nice neighbor. The plastic sheeting is a hobby.'],
  ['blob', 'Blob', 'It does not walk. It arrives anyway.'],
  ['skeleton', 'Skeleton', 'All bone, no chill, and somehow still cold.'],
  ['evil-doll', 'Evil Doll', 'The smile does not blink. You will.'],
  ['slayer', 'Vampire Slayer', 'The stake is in the purse, next to the gum.'],
  ['cannibal', 'Cannibal Psychiatrist', 'Dinner is served. You should ask who.'],
  ['sasquatch', 'Sasquatch', 'Blurry on purpose. The footprints are not.'],
  ['possessed-car', 'Demon-Possessed Car', 'The engine revs when you say its name.'],
  ['killer-bees', 'Swarm of Killer Bees', 'A committee with stingers and one agenda.'],
  ['smoke', 'Smoke Monster', 'Whispers in a voice you used to trust.'],
  ['devil', 'The Devil', 'The deal looks fair. The fine print is you.'],
  ['reaper', 'Grim Reaper', 'Always on time. The hood is nonnegotiable.'],
  ['dream-slasher', 'Dream Slasher', 'The glove is the entire personality.'],
  ['hunchback', 'Hunchback', 'The bell rings. He was already listening.'],
  ['hockey-mask', 'Hockey-Mask Slasher', 'Does not hurry. Is somehow already there.'],
  ['demon', 'Demon', 'The invitation was implied. It accepted.'],
] as const satisfies readonly Addition[];

export const animeCharacterAdditions = [
  ['street-fighter', 'Street Fighter', 'The special move has a longer name than you.'],
] as const satisfies readonly Addition[];

export const everydayCharacterAdditions = [
  ['vegan', 'Vegan', 'Brought a dish, and will mention it twice.'],
  ['hipster', 'Hipster', 'Liked this fight before it was decided.'],
  ['marching-band', 'High School Marching Band', 'One hundred people, one tuba, and no brakes.'],
  ['pageant', 'Child Beauty Pageant Queen', 'The wave is tiny. The ambition is not.'],
  ['bowling', 'Senior Citizen Bowling Team', 'The ball is slow. The trash talk is vintage.'],
  ['significant-other', 'My Significant Other', 'Knows where you keep the good comeback.'],
  ['acappella', 'College A Cappella Group', 'The beat is a mouth, and the mouth is committed.'],
  ['boss', 'My Boss', 'Schedules the showdown during your lunch.'],
  ['cat-lady', 'Crazy Cat Lady', 'The cats vote with her. They have the numbers.'],
  ['nudist', 'Nudist', 'Nothing to hide, including the strategy.'],
  ['redneck', 'Redneck', 'The truck is part of the argument.'],
  ['kindergarten', 'Kindergarten Class', 'Twenty tiny dictators and one snack policy.'],
  ['sweater-neighbor', 'Kindly Sweater Neighbor', 'The cardigan is a peace treaty you will take.'],
  ['your-mom', 'Your Mom', 'Asks if you ate, then ends the fight.'],
  ['ex', 'My Ex', 'Remembers the password and the weak point.'],
  ['hobo', 'Hobo', 'The bindle holds a plan and a very good stick.'],
  ['boy-scout', 'Boy Scout', 'Prepared for weather, bears, and your excuse.'],
  ['girl-scout', 'Girl Scout', 'The cookies are a door. She is already inside.'],
  ['twins', 'Identical Twins', 'You cannot tell them apart. They can.'],
  ['mime', 'Mime', 'The wall is invisible. The point is not.'],
] as const satisfies readonly Addition[];

export const housePowerAdditions = [
  ['flamethrower', 'Armed with a flamethrower', 'The conversation gets warmer, immediately.'],
  ['sniper', 'Armed with a sniper rifle', 'Makes the point from a very polite distance.'],
  ['winds', 'Can blow 200-mph winds', 'The room rearranges itself around the sentence.'],
  ['underwater', 'Can breathe underwater', 'Argues fine. Everyone else is bubbling.'],
  ['any-animal', 'Can become any animal', 'Becomes whichever creature has the better poster.'],
  ['teleports', 'Teleports', 'Leaves mid-excuse and arrives mid-victory.'],
  ['magnetism', 'Controls magnetism', 'Every loose nail, and every loose plan, comes over.'],
  ['xray', 'X-ray vision', 'Sees the bluff, and the skeleton telling it.'],
  ['sonic', 'Sonic scream', 'The scream has a note. The note has a crater.'],
  ['impact', 'Unaffected by impact', 'Gets hit, checks a watch, and continues.'],
] as const satisfies readonly Addition[];

export const fantasyPowerAdditions = [
  ['holy-grenades', 'Armed with holy hand grenades', 'Count to three. The chapel insists.'],
  ['breathes-fire', 'Breathes fire', 'The punchline arrives already preheated.'],
  ['berserker', 'Berserker rage', 'The plan leaves. Something louder stays.'],
  ['centaur', 'Riding a depressed centaur', 'Half horse, fully over it, still on the clock.'],
] as const satisfies readonly Addition[];

export const scifiPowerAdditions = [
  ['shrink-ray', 'Armed with a shrink ray', 'Makes the problem smaller. The ego stays full size.'],
  ['jet-pack', 'Wearing a jet-pack', 'Up is a personality now.'],
] as const satisfies readonly Addition[];

export const horrorPowerAdditions = [
  ['mist', 'Can become mist while holding breath', 'Gone while the breath lasts. Back with notes.'],
] as const satisfies readonly Addition[];

export const everydayPowerAdditions = [
  ['shampoo', 'Has shampoo in eyes', 'Eyes shut. The point gets slippery.'],
  ['cries', 'Cries uncontrollably', 'Tears on tap. Suddenly you feel like the villain.'],
] as const satisfies readonly Addition[];

export const absurdPowerAdditions = [
  ['shotgun-shotguns', 'Armed with a shotgun that shoots shotguns', 'Each blast files its own paperwork, loudly.'],
  ['superglue', 'Armed with a superglue fire hose', 'The hose is committed. So is everyone it hits.'],
  ['sausage', 'Armed with an infinite sausage lasso', 'A lasso with seasoning and no upper limit.'],
  ['shark-cage', 'Locked in a shark cage', 'Safe, wet, and unable to reach the snacks.'],
  ['guacamole', 'Made of guacamole', 'Delicious, and structurally a suggestion.'],
  ['believes-invisible', 'Believes they are invisible', 'Waves. Everyone waves back. The bit continues.'],
  ['stupid', 'Really stupid', 'The plan is bold because the plan is missing.'],
  ['no-bones', 'No bones', 'Collapses with confidence, and keeps talking.'],
  ['molasses', 'Flying at the speed of molasses', 'Airborne, technically. The calendar disagrees.'],
  ['unicycle-half', 'Bottom half is a unicycle', 'The top has ideas. The wheel has one.'],
  ['kazoo', 'Constantly playing a kazoo', 'Every speech gets a solo nobody requested.'],
] as const satisfies readonly Addition[];

export const absurdCharacterAdditions = [
  ['reggae', 'Reggae Band', 'The bassline arrives late and wins anyway.'],
  ['carnie', 'Carnie', 'Guesses your weight, then your whole deal.'],
  ['canada', 'Canada', 'Apologizes, then takes the entire map.'],
  ['search-engine', 'The Search Engine', 'Finishes your sentence, then sells the draft.'],
  ['purple-dinosaur', 'Purple Dinosaur', 'Hugs first. The hug has a theme song.'],
  ['pet-rock', 'Pet Rock', 'Loyal, quiet, and impossible to outlast.'],
  ['cactus', 'Cactus', 'Huggable, if you enjoy the consequences.'],
  ['illuminati', 'The Illuminati', 'The triangle already knows, and is not telling.'],
  ['boy-band', 'Boy Band', 'Four-part harmony. One-part hair product.'],
  ['head', 'Disembodied Head', 'No body, and still has notes on the meeting.'],
  ['clown-posse', 'Literally Insane Clown Posse', 'The face paint showed up with a manifesto.'],
  ['prince', 'Nigerian Prince', 'The fortune is in your inbox. So is the prince.'],
  ['fainting-goat', 'Fainting Goat', 'Startles, goes rigid, and is still present.'],
  ['burning-man', 'Everyone at Burning Man', 'Dusty, glittering, and late to their own theme.'],
  ['lineup', 'Music Festival Lineup', 'Twelve acts, one portable toilet, and no mercy.'],
  ['liberty', 'The Statue of Liberty', 'The torch is a suggestion you can see for miles.'],
  ['puppies', '101 Spotted Puppies', 'Too many spots to count, and they know it.'],
  ['un', 'The U.N.', 'Calls a vote. The vote calls a subcommittee.'],
  ['marshmallow', 'Giant Marshmallow Man', 'Squishy, city-sized, and blocking the avenue.'],
  ['reality-tv', 'Reality TV Family', 'The confession camera is already rolling.'],
] as const satisfies readonly Addition[];
