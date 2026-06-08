path = r'C:/Users/KimRipia/Downloads/timetracker_23/timetracker/index.html'
with open(path, 'r', encoding='utf-8') as f:
    html = f.read()

quotes = [
  # Haikyuu!!
  ('Talent is something you make bloom; instinct is something you polish.', 'Oikawa Tooru — Furudate, Haikyuu!!, 2012'),
  ("Even if we're not confident that we'll win, we can still fight for it!", 'Hinata Shoyo — Furudate, Haikyuu!!, 2012'),
  ('The last one to give up is the one who wins.', 'Furudate, Haikyuu!!, c.2013'),
  ("Don't stay the same. Keep evolving.", 'Kageyama Tobio — Furudate, Haikyuu!!, c.2014'),
  ('If I stop now, I lose. So I keep going.', 'Furudate, Haikyuu!!, c.2015'),
  # One Piece
  ('No matter how hard or impossible it is, never lose sight of your goal.', 'Monkey D. Luffy — Eiichiro Oda, One Piece, c.1999'),
  ("Power isn't determined by your size, but by the size of your heart and dreams.", 'Monkey D. Luffy — Eiichiro Oda, One Piece, c.2000'),
  ("If I can't protect my crewmates, I have no right to become King of the Pirates.", 'Monkey D. Luffy — Eiichiro Oda, One Piece, c.2000'),
  # Naruto
  ("A person grows up when they're able to overcome hardship.", 'Jiraiya — Masashi Kishimoto, Naruto, c.2006'),
  ("I never go back on my word. That's my ninja way.", 'Naruto Uzumaki — Masashi Kishimoto, c.2002'),
  ('When people protect something truly precious, they can become as strong as they need to be.', 'Haku — Masashi Kishimoto, Naruto, c.2000'),
  ("It's not the face that makes someone a monster. It's the choices they make.", 'Naruto Uzumaki — Masashi Kishimoto'),
  # Attack on Titan
  ("The world is merciless, and it's also very beautiful.", 'Mikasa Ackerman — Hajime Isayama, c.2009'),
  ("If you don't fight, you can't win.", 'Eren Yeager — Hajime Isayama, c.2009'),
  # DC / Comics
  ('Why do we fall? So that we can learn to pick ourselves back up.', 'Alfred Pennyworth — Christopher Nolan, 2005'),
  ("It's not who I am underneath, but what I do that defines me.", 'Bruce Wayne — Christopher Nolan, Batman Begins, 2005'),
  ('The night is darkest just before the dawn. And I promise you, the dawn is coming.', 'Harvey Dent — Christopher Nolan, The Dark Knight, 2008'),
  ("Life doesn't give us purpose. We give life purpose.", 'Barry Allen — DC Comics'),
  # Sports Stars
  ("I've failed over and over again in my life. And that is why I succeed.", 'Michael Jordan, c.1997'),
  ('Everything negative — pressure, challenges — is an opportunity for me to rise.', 'Kobe Bryant, c.2010'),
  ('The moment you give up is the moment you let someone else win.', 'Kobe Bryant, c.2009'),
  ("I trained 4 years to run 9 seconds. People give up when they don't see results in 2 months.", 'Usain Bolt, c.2012'),
  ('A champion is defined not by their wins but by how they can recover when they fall.', 'Serena Williams, c.2015'),
  ('You have to believe in yourself when no one else does.', 'Serena Williams, c.2012'),
  ('I am not the best, but I work hard to become the best.', 'Cristiano Ronaldo, c.2014'),
  ('It took me 17 years and 114 days to become an overnight success.', 'Lionel Messi, c.2013'),
  ('Do you have to be obsessed? No. But it helps.', 'Simone Biles, c.2020'),
  ("Don't count the days. Make the days count.", 'Muhammad Ali, c.1970'),
  # Oscar Wilde
  ('Be yourself; everyone else is already taken.', 'Oscar Wilde, c.1890'),
  ('We are all in the gutter, but some of us are looking at the stars.', "Oscar Wilde, Lady Windermere's Fan, 1892"),
  ('To live is the rarest thing in the world. Most people just exist.', 'Oscar Wilde, The Soul of Man, 1891'),
  ('Always forgive your enemies. Nothing annoys them so much.', 'Oscar Wilde, c.1890'),
  ('Experience is simply the name we give our mistakes.', "Oscar Wilde, Lady Windermere's Fan, 1892"),
  # Shakespeare
  ('We know what we are, but know not what we may be.', 'Ophelia — William Shakespeare, Hamlet, c.1601'),
  ('All the world is a stage, and all the men and women merely players.', 'William Shakespeare, As You Like It, 1599'),
  ('What a piece of work is a man! How noble in reason, how infinite in faculty!', 'Hamlet — William Shakespeare, c.1601'),
  ('The lady doth protest too much, methinks.', 'Gertrude — William Shakespeare, Hamlet, c.1601'),
  ('Expectation is the root of all heartache.', 'William Shakespeare, c.1600'),
  ('This above all: to thine own self be true.', 'Polonius — William Shakespeare, Hamlet, c.1601'),
  ('We are such stuff as dreams are made on.', 'Prospero — William Shakespeare, The Tempest, c.1611'),
  # Alan Watts
  ('The only way to make sense out of change is to plunge into it and join the dance.', 'Alan Watts, c.1960'),
  ('You are under no obligation to be the same person you were a year ago.', 'Alan Watts, c.1960'),
  ('This is the real secret of life: to be completely engaged with what you are doing right now.', 'Alan Watts, c.1960'),
  ('Man suffers only because he takes seriously what the gods made for fun.', 'Alan Watts, c.1965'),
  # Carl Sagan
  ('We are a way for the cosmos to know itself.', 'Carl Sagan, Cosmos, 1980'),
  ('Somewhere, something incredible is waiting to be known.', 'Carl Sagan, c.1977'),
  ('The cosmos is within us. We are made of star-stuff.', 'Carl Sagan, Cosmos, 1980'),
  # Thought-provoking
  ("The most dangerous phrase in the language is we've always done it this way.", 'Grace Hopper, c.1984'),
  ('The measure of intelligence is the ability to change.', 'Albert Einstein, c.1922'),
  ('It is the mark of an educated mind to entertain a thought without accepting it.', 'Aristotle, c.340 BCE'),
  ('Question everything. Learn something. Answer nothing.', 'Euripides, c.450 BCE'),
  ("Two things are infinite: the universe and human stupidity. And I'm not sure about the universe.", 'Albert Einstein, c.1930'),
  ('The quieter you become, the more you are able to hear.', 'Ram Dass, c.1971'),
  # Literature
  ('A reader lives a thousand lives before he dies. The man who never reads lives only one.', 'George R.R. Martin, A Dance with Dragons, 2011'),
  ('That which does not kill us makes us stronger.', 'Friedrich Nietzsche, Twilight of the Idols, 1888'),
  ('The most common way people give up their power is by thinking they do not have any.', 'Alice Walker, c.1992'),
  ('It is never too late to be what you might have been.', 'George Eliot, c.1870'),
  ('You cannot go back and change the beginning, but you can start where you are and change the ending.', 'C.S. Lewis, c.1955'),
  ('We accept the love we think we deserve.', 'Stephen Chbosky, The Perks of Being a Wallflower, 1999'),
  ('One must always be careful of books, and what is inside them.', 'Cassandra Clare, City of Bones, 2007'),
  # Rumi
  ('What you seek is seeking you.', 'Rumi, c.1250'),
  ('Out beyond ideas of wrongdoing and rightdoing, there is a field. Meet me there.', 'Rumi, c.1250'),
  ('Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.', 'Rumi, c.1250'),
  # Affirmations
  ('You are enough. You have always been enough.', 'Positive affirmation'),
  ('Every day is a second chance.', 'Positive affirmation'),
  ('You are not your mistakes. You are not your struggles.', 'Positive affirmation'),
  ("You didn't come this far to only come this far.", 'Positive affirmation'),
  ('The version of you that got through hard days is proof of your strength.', 'Positive affirmation'),
  ('Rest if you must, but do not quit.', 'Edgar A. Guest, c.1921'),
  ('Your only limit is you.', 'Positive affirmation'),
  ('She needed a hero so she became one.', 'Unknown'),
  ('In a world where you can be anything, be kind.', 'Unknown'),
  # Oprah
  ('Turn your wounds into wisdom.', 'Oprah Winfrey, c.2001'),
  ('The biggest adventure you can take is to live the life of your dreams.', 'Oprah Winfrey, c.2002'),
  ('Do not be ashamed of your failures. Learn from them and move on.', 'Oprah Winfrey, c.2003'),
  # Misc gems
  ('The people who are crazy enough to think they can change the world are the ones who do.', "Rob Siltanen, Apple 'Think Different', 1997"),
  ('Normal is an illusion. What is normal for the spider is chaos for the fly.', 'Charles Addams, c.1950'),
  ('Fall seven times, stand up eight.', 'Japanese proverb'),
  ('He who conquers himself is the mightiest warrior.', 'Confucius, c.500 BCE'),
  ('The journey of a thousand miles begins with a single step.', 'Lao Tzu, Tao Te Ching, c.400 BCE'),
  ('He who has a why to live can bear almost any how.', 'Friedrich Nietzsche, c.1888'),
  ('Rivers know this: there is no hurry. We shall get there some day.', "A.A. Milne, Winnie-the-Pooh, 1926"),
  ('Sometimes the smallest things take up the most room in your heart.', "A.A. Milne, Winnie-the-Pooh, 1926"),
  ('If you want to go fast, go alone. If you want to go far, go together.', 'African proverb'),
  ('Stars cannot shine without darkness.', 'D.H. Sidebottom, c.2013'),
  ('Do it with passion or not at all.', 'Rosa Nouchette Carey, c.1884'),
  ('Be a voice, not an echo.', 'Albert Einstein, c.1920'),
  ('One child, one teacher, one book, one pen can change the world.', 'Malala Yousafzai, Nobel Prize Speech, 2014'),
  ('Real change, enduring change, happens one step at a time.', 'Ruth Bader Ginsburg, c.2002'),
  ('There are no great people. Only great challenges that ordinary people rise to meet.', 'Admiral William Halsey, c.1945'),
  ('Creativity is intelligence having fun.', 'Albert Einstein, c.1929'),
  ('Logic will get you from A to B. Imagination will take you everywhere.', 'Albert Einstein, c.1929'),
]

lines = []
for text, author in quotes:
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
print(f"Total quotes now: {count}")
