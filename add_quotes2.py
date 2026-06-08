path = r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

# Fix macrons in existing Maori quote
html = html.replace(
    'Tuukua nga mahi kia koorero \xe2\x80\x94 let the work speak for itself.',
    'Tukua ngā mahi kia kōrero — let the work speak for itself.'
)
html = html.replace(
    'Tuukua nga mahi kia koorero — let the work speak for itself.',
    'Tukua ngā mahi kia kōrero — let the work speak for itself.'
)
# Fix Maori -> Māori
html = html.replace('"Maori proverb"', '"Māori proverb"')

big = [
  # --- Feminism ---
  ("One is not born, but rather becomes, a woman.", "Simone de Beauvoir, The Second Sex, 1949"),
  ("I do not wish women to have power over men; but over themselves.", "Mary Wollstonecraft, A Vindication of the Rights of Woman, 1792"),
  ("The most courageous act is still to think for yourself. Aloud.", "Coco Chanel, c.1960"),
  ("I am no bird; and no net ensnares me.", "Charlotte Brontë, Jane Eyre, 1847"),
  ("I am not free while any woman is unfree, even when her shackles are very different from my own.", "Audre Lorde, c.1981"),
  ("Caring for myself is not self-indulgence, it is self-preservation, and that is an act of political warfare.", "Audre Lorde, A Burst of Light, 1988"),
  ("A woman must have money and a room of her own if she is to write fiction.", "Virginia Woolf, A Room of One's Own, 1929"),
  ("You cannot find peace by avoiding life.", "Virginia Woolf, c.1930"),
  ("If you have some power, then your job is to empower somebody else.", "Toni Morrison, c.2004"),
  ("You wanna fly, you got to give up the shit that weighs you down.", "Toni Morrison, Song of Solomon, 1977"),
  ("We should all be feminists.", "Chimamanda Ngozi Adichie, TEDx, 2012"),
  ("When they go low, we go high.", "Michelle Obama, DNC speech, 2016"),
  ("No country can ever truly flourish if it stifles the potential of its women.", "Michelle Obama, c.2012"),
  ("I would rather be a bad feminist than no feminist at all.", "Roxane Gay, Bad Feminist, 2014"),
  ("The truth will set you free, but first it will piss you off.", "Gloria Steinem, c.1970"),
  ("I am not afraid. I was born to do this.", "Joan of Arc, c.1429"),
  ("Well-behaved women seldom make history.", "Laurel Thatcher Ulrich, 1976"),
  ("Above all, be the heroine of your life, not the victim.", "Nora Ephron, Wellesley commencement, 1996"),
  ("I am too intelligent, too demanding, and too resourceful for anyone to be able to take charge of me entirely.", "Simone de Beauvoir, c.1950"),
  # --- Psychology ---
  ("Until you make the unconscious conscious, it will direct your life and you will call it fate.", "Carl Jung, c.1950"),
  ("The most terrifying thing is to accept oneself completely.", "Carl Jung, c.1950"),
  ("Where love rules, there is no will to power; and where power predominates, love is lacking.", "Carl Jung, c.1917"),
  ("Everything can be taken from a man but one thing: the freedom to choose one's attitude in any given set of circumstances.", "Viktor Frankl, Man's Search for Meaning, 1946"),
  ("Between stimulus and response there is a space. In that space is our power to choose our response.", "Viktor Frankl, c.1946"),
  ("In any given moment we have two options: to step forward into growth or to step back into safety.", "Abraham Maslow, c.1962"),
  ("Vulnerability is not winning or losing; it's having the courage to show up and be seen.", "Brené Brown, Daring Greatly, 2012"),
  ("You cannot shame or belittle people into changing their behaviours.", "Brené Brown, c.2010"),
  ("The greatest weapon against stress is our ability to choose one thought over another.", "William James, c.1890"),
  ("Life is what you make it. Always has been, always will be.", "Eleanor Roosevelt, c.1940"),
  ("Knowing yourself is the beginning of all wisdom.", "Aristotle, c.340 BCE"),
  ("He who knows others is wise. He who knows himself is enlightened.", "Lao Tzu, Tao Te Ching, c.400 BCE"),
  # --- Music ---
  ("Music is the mediator between the spiritual and the sensual life.", "Ludwig van Beethoven, c.1810"),
  ("I don't know where I'm going from here, but I promise it won't be boring.", "David Bowie, c.1997"),
  ("Tomorrow belongs to those who can hear it coming.", "David Bowie, c.1976"),
  ("An artist's duty is to reflect the times.", "Nina Simone, c.1968"),
  ("You've got to learn to leave the table when love's no longer being served.", "Nina Simone, c.1976"),
  ("Love the life you live. Live the life you love.", "Bob Marley, c.1980"),
  ("One good thing about music — when it hits you, you feel no pain.", "Bob Marley, Trenchtown Rock, 1971"),
  ("It takes a long time to play like yourself.", "Miles Davis, c.1960"),
  ("Life is what happens when you're busy making other plans.", "John Lennon, Beautiful Boy, 1980"),
  ("Music gives a soul to the universe, wings to the mind, flight to the imagination, and life to everything.", "Plato, c.390 BCE"),
  ("Without music, life would be a mistake.", "Friedrich Nietzsche, Twilight of the Idols, 1888"),
  ("One day I will be at the right place at the right time. Today I practice.", "Unknown — musician's affirmation"),
  # --- Art ---
  ("Creativity takes courage.", "Henri Matisse, c.1950"),
  ("I've been absolutely terrified every moment of my life — and I've never let it keep me from doing a single thing.", "Georgia O'Keeffe, c.1970"),
  ("Have no fear of perfection — you'll never reach it.", "Salvador Dalí, c.1960"),
  ("They always say time changes things, but you actually have to change them yourself.", "Andy Warhol, The Philosophy of Andy Warhol, 1975"),
  ("Art is not what you see, but what you make others see.", "Edgar Degas, c.1880"),
  ("Art should comfort the disturbed and disturb the comfortable.", "Banksy, c.2006"),
  ("The purpose of art is washing the dust of daily life off our souls.", "Pablo Picasso, c.1950"),
  ("I am always doing that which I cannot do, in order that I may learn how to do it.", "Pablo Picasso, c.1940"),
  ("Colour is my day-long obsession, joy and torment.", "Claude Monet, c.1890"),
  ("If people knew how hard I worked to get my mastery, it wouldn't seem so wonderful at all.", "Michelangelo, c.1500"),
  ("Go and make interesting mistakes, make amazing mistakes, make glorious and fantastic mistakes.", "Neil Gaiman, commencement speech, 2012"),
  ("The world always seems brighter when you've just made something that wasn't there before.", "Neil Gaiman, c.2010"),
  # --- Philosophy (more) ---
  ("Life can only be understood backwards; but it must be lived forwards.", "Søren Kierkegaard, Journals, 1843"),
  ("Judge a man by his questions rather than by his answers.", "Voltaire, c.1760"),
  ("The only way to deal with an unfree world is to become so absolutely free that your very existence is an act of rebellion.", "Albert Camus, c.1945"),
  ("You will never be happy if you continue to search for what happiness consists of.", "Albert Camus, c.1942"),
  ("Attention is the rarest and purest form of generosity.", "Simone Weil, c.1940"),
  ("The unexamined life is not worth living.", "Socrates — Plato, Apology, c.399 BCE"),
  ("I think, therefore I am.", "René Descartes, Discourse on the Method, 1637"),
  ("The only freedom which deserves the name is that of pursuing our own good in our own way.", "John Stuart Mill, On Liberty, 1859"),
  ("Man is condemned to be free.", "Jean-Paul Sartre, Existentialism is a Humanism, 1945"),
  ("Hell is other people.", "Jean-Paul Sartre, No Exit, 1944"),
  ("We are what we pretend to be, so we must be careful about what we pretend to be.", "Kurt Vonnegut, Mother Night, 1962"),
  ("Of all the things I've lost, I miss my mind the most.", "Mark Twain, c.1900"),
  # --- More Shakespeare ---
  ("To be, or not to be — that is the question.", "Hamlet — William Shakespeare, c.1601"),
  ("Brevity is the soul of wit.", "Polonius — William Shakespeare, Hamlet, c.1601"),
  ("What's in a name? That which we call a rose by any other name would smell as sweet.", "Juliet — William Shakespeare, Romeo and Juliet, c.1597"),
  ("The robbed that smiles, steals something from the thief.", "Othello — William Shakespeare, c.1603"),
  ("Our doubts are traitors and make us lose the good we oft might win.", "Lucio — William Shakespeare, Measure for Measure, c.1603"),
  # --- More anime ---
  ("Humankind cannot gain anything without first giving something in return.", "Alphonse Elric — Hiromu Arakawa, Fullmetal Alchemist, 2001"),
  ("A lesson without pain is meaningless. That's because no one can gain without sacrificing something.", "Edward Elric — Hiromu Arakawa, FMA: Brotherhood, 2009"),
  ("You can become a hero!", "All Might — Kōhei Horikoshi, My Hero Academia, c.2014"),
  ("A hero isn't someone who never fails. A hero is someone who gets back up.", "Kōhei Horikoshi, My Hero Academia, c.2016"),
  ("The most important things in life aren't things.", "Natsuki Takaya, Fruits Basket, c.2001"),
  ("No matter how deep the night, it always turns to day, eventually.", "Brook — Eiichiro Oda, One Piece, c.2007"),
  ("If you don't like your destiny, don't accept it. Instead, have the courage to change it the way you want it to be.", "Naruto Uzumaki — Masashi Kishimoto"),
  # --- Movies ---
  ("Seize the day. Make your lives extraordinary.", "John Keating — Tom Schulman, Dead Poets Society, 1989"),
  ("It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.", "Rocky Balboa — Sylvester Stallone, Rocky Balboa, 2006"),
  ("Life is like a box of chocolates — you never know what you're gonna get.", "Forrest Gump — Eric Roth, Forrest Gump, 1994"),
  ("Remember who you are.", "Mufasa — Jonathan Roberts/Linda Woolverton, The Lion King, 1994"),
  ("The ocean chose you for a reason.", "Gramma Tala — Jared Bush/Pamela Ribon, Moana, 2016"),
  ("To infinity and beyond!", "Buzz Lightyear — Joss Whedon et al., Toy Story, 1995"),
  ("Just keep swimming.", "Dory — Andrew Stanton, Finding Nemo, 2003"),
  ("Adventure is out there!", "Up — Bob Peterson/Pete Docter, 2009"),
  ("The things that make me different are the things that make me.", "Winnie the Pooh — A.A. Milne, c.1926"),
  ("Some people are worth melting for.", "Olaf — Jennifer Lee, Frozen, 2013"),
  ("Love is putting someone else's needs before yours.", "Olaf — Jennifer Lee, Frozen, 2013"),
  ("Change is nature. The part that we can influence — and it starts when we decide.", "Rémy — Brad Bird, Ratatouille, 2007"),
  ("Free your mind.", "Morpheus — Wachowskis, The Matrix, 1999"),
  ("Love is the one thing capable of transcending time and space.", "Brand — Christopher Nolan, Interstellar, 2014"),
  # --- Chinese proverbs ---
  ("When the winds of change blow, some build walls and others build windmills.", "Chinese proverb"),
  ("Give a man a fish and you feed him for a day. Teach a man to fish and you feed him for a lifetime.", "Chinese proverb"),
  ("The man who removes a mountain begins by carrying away small stones.", "Chinese proverb"),
  ("Be not afraid of growing slowly; be afraid only of standing still.", "Chinese proverb"),
  ("A gem is not polished without rubbing, nor a man perfected without trials.", "Chinese proverb"),
  ("Learning is a treasure that will follow its owner everywhere.", "Chinese proverb"),
  ("To know the road ahead, ask those coming back.", "Chinese proverb"),
  ("Tension is who you think you should be. Relaxation is who you are.", "Chinese proverb"),
  ("The temptation to quit will be greatest just before you are about to succeed.", "Chinese proverb"),
  ("A book holds a house of gold.", "Chinese proverb"),
  ("He who asks is a fool for five minutes. He who does not ask remains a fool forever.", "Chinese proverb"),
  # --- World proverbs ---
  ("Not to know is bad; not to wish to know is worse.", "West African proverb"),
  ("We do not inherit the earth from our ancestors; we borrow it from our children.", "Native American proverb"),
  ("This too shall pass.", "Persian proverb, c.1200"),
  ("However long the night, the dawn will break.", "West African proverb"),
  ("A tree is straightened while it is young.", "Hebrew proverb"),
  ("Without effort, no harvest.", "Danish proverb"),
  ("Even a small star shines in the darkness.", "Finnish proverb"),
  ("He who has health has hope; and he who has hope has everything.", "Arabian proverb"),
  ("Turn your face toward the sun and the shadows fall behind you.", "Māori proverb"),
  ("Whakataka te hau — let the wind cease, let the breeze cease, and let there be peace.", "Māori karakia"),
  ("Ehara taku toa i te toa takitahi, engari taku toa he toa takitini — my strength is not as an individual, but as a collective.", "Māori proverb"),
  # --- More hip hop / music ---
  ("I'm always gonna rise up.", "Kendrick Lamar, ELEMENT., 2017"),
  ("Sit down, be humble.", "Kendrick Lamar, HUMBLE., 2017"),
  ("Be careful with me.", "Cardi B, c.2018"),
  ("I'm the one that's got to die when it's time for me to die, so let me live my life the way I want to.", "Jimi Hendrix, c.1967"),
  ("When I get sad, I stop being sad and be awesome instead.", "Barney Stinson — Carter Bays, How I Met Your Mother, 2008"),
  ("Music can change the world because it can change people.", "Bono, c.2000"),
  ("I am not going to be a star. I am going to be a legend.", "Freddie Mercury, c.1985"),
  ("There are two tragedies in life. One is to lose your heart's desire. The other is to gain it.", "George Bernard Shaw, Man and Superman, 1902"),
  # --- More positive/open-minded ---
  ("The wound is the place where the light enters you.", "Rumi, c.1250"),
  ("Not all those who wander are lost.", "J.R.R. Tolkien, The Fellowship of the Ring, 1954"),
  ("Some days you will be the light for others, and some days you will need some light from them.", "Unknown"),
  ("Be curious, not judgmental.", "Walt Whitman, c.1855"),
  ("Do I contradict myself? Very well then I contradict myself — I am large, I contain multitudes.", "Walt Whitman, Song of Myself, 1855"),
  ("I am not afraid of tomorrow, for I have seen yesterday and I love today.", "William Allen White, c.1920"),
  ("You must do the thing you think you cannot do.", "Eleanor Roosevelt, You Learn by Living, 1960"),
  ("No one can make you feel inferior without your consent.", "Eleanor Roosevelt, c.1937"),
  ("You yourself, as much as anybody in the entire universe, deserve your love and affection.", "Buddha, c.500 BCE"),
  ("Three things cannot be long hidden: the sun, the moon, and the truth.", "Buddha, c.500 BCE"),
  ("Peace comes from within. Do not seek it without.", "Buddha, c.500 BCE"),
  ("The mind is everything. What you think you become.", "Buddha, c.500 BCE"),
  ("Yesterday is history. Tomorrow is a mystery. Today is a gift — that's why they call it the present.", "Alice Morse Earle, c.1902"),
  ("It does not matter how slowly you go as long as you do not stop.", "Confucius, c.500 BCE"),
  ("Our greatest glory is not in never falling, but in rising every time we fall.", "Confucius, c.500 BCE"),
  ("We cannot direct the wind, but we can adjust the sails.", "Dolly Parton, c.1990"),
  ("Find out who you are and do it on purpose.", "Dolly Parton, c.1990"),
  ("I'm not going to limit myself just because people won't accept the fact that I can do something else.", "Dolly Parton, c.1985"),
]

lines = []
for text, author in big:
    t = text.replace('\\', '\\\\').replace('"', '\\"')
    a = author.replace('\\', '\\\\').replace('"', '\\"')
    lines.append('  {text:"' + t + '",author:"' + a + '"}')

new_block = ',\n'.join(lines)
idx = html.rfind('\n];')
html = html[:idx] + ',\n' + new_block + '\n];' + html[idx+3:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(html)

import re
count = len(re.findall(r'\{text:', html))
print(f"Total quotes: {count}")
print("Macrons fixed:", 'Tukua ngā mahi kia kōrero' in html)
print("Maori -> Maori with macron:", 'Māori proverb' in html)
print("Beauvoir:", 'Simone de Beauvoir' in html)
print("Carl Jung:", 'Carl Jung' in html)
print("Ghibli kept:", 'Spirited Away' in html)
