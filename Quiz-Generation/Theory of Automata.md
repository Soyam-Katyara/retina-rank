# Empty string
A string with no letters: λ or ε
### Observations
- |λ| = 0
- λw = wλ = w
- λabba = abbaλ = abba

**Note:**
Sets: ∅ = {} ≠ {λ}
Set size: |∅| = |{}| = 0
Set size String: |{λ}| = 1
length: |λ| = 0

# Infinite Language
L = {a<sup>n</sup>b<sup>n</sup> : n >= 0}

ab ∈ L
aabb ∈ L 
aaaaabbbbb ∈ L
abb ∉ L

# What is a Language? 
- It is simple a set of strings
- A sequence of letters/characters/alphabets:
- Examples: “cat”, “dog”, “house”, …

# Defining a Language
- ∑ = {a, b, c, ….. , z}

# Alphabets & Strings
let ∑ = {a, b} is a set of alphabets

possible strings

| a           |            |
| ----------- | ---------- |
| ab          | u = ab     |
| abba        | v = bbbaaa |
| baba        | w = abba   |
| aaabbbaabab |            |
# Palindrome
A string that reads the same forward and backward

w = w<sup>R</sup>

example:

| w       | w<sup>R</sup> | ☑️/❌ |
| ------- | ------------- | ---- |
| sky     | yks           | ❌    |
| racecar | racecar       | ☑️   |
| civic   | civic         | ☑️   |
| ball    | llab          | ❌    |

# Star (*) Kleene’s Closure
- Given an alphabet ∑, we wish to define a language in which any string of letters from ∑ is a word, even the null string.
- This language we shall call the closure of the alphabet. It is denoted by writing a star (an asterisk) after the name of the alphabet as a superscript ∑*

### Examples
if ∑ = {x} then:
	∑* = {λ, x, xx, xxx ... }

if ∑ = {0, 1} then:
	∑* = {λ, 0, 1, 00, 01, 10, 11, 000, 001 ... }

if ∑ = {a, b} then:
	∑* = {λ, a, b, aa, ab, ba, bb, aaa, aab ... }

if ∑ = {a, b, c} then:
	∑* = {λ, a, b, c, aa, ab, ac, ba, bb, bc, ca, cb, cc, aaa ... }

# Language
A language is any subset of ∑*

∑ = {a, b}
∑* = {λ, a, b, aa, ab, ba, bb, aaa, aab ... }

L<sub>1</sub> = {λ}
L<sub>2</sub> = {a, aa, aab}
L<sub>3</sub> = {λ, abba, baba, aa, ab, aaaaaa}

# String Operations
# Length
w = a<sub>1</sub>a<sub>2</sub> … a<sub>n</sub>
length: |w| = n

example:
|soyyam| = 6
|katyara| = 7

# Concatenation
w = a<sub>1</sub>a<sub>2</sub> … a<sub>n</sub>
v = b<sub>1</sub>b<sub>2</sub> … b<sub>m</sub>

wv = a<sub>1</sub>a<sub>2</sub> … a<sub>n</sub> b<sub>1</sub>b<sub>2</sub> … b<sub>m</sub>

example:
w = cristiano
v = ronaldo
wv = cristianoronaldo

### Length of Concatenation:
|uv| = |u| + |v|

example:
u = hello, |u| = 5
v = world, |v| = 5

uv = helloworld, |uv| = 10

### Language Concatenation
defination:
L<sub>1</sub>L<sub>2</sub> = {xy: x ∈ L<sub>1</sub>, y ∈ L<sub>2</sub>}

example: 
L<sub>1</sub> = {a, ab, ba}, L<sub>2</sub> = {b, aa}
L<sub>1</sub>L<sub>2</sub> = {ab, aaa, abb, abaa, bab, baaa}
# Reverse
w = a<sub>1</sub>a<sub>2</sub> … a<sub>n</sub>
w<sup>R</sup> = a<sub>n</sub> ... a<sub>2</sub>a<sub>1</sub>

example:
w = hello
w<sup>R</sup> = olleh

### Language Reverse
L<sup>R</sup>  = {w<sup>R</sup>  : w ∈ L} 

example:
L = {hello, world}
L<sup>R</sup>  = {olleh, dlrow}
# Power of a String
It is simply repeating (concatenating) a string multiple times.

Example:
(abba)<sup>2</sup> = abbaabba
(abba)<sup>0</sup> = λ                    

# Power of a Language
Defination: L<sup>n</sup> = LL ... L (n times concetination)

example:
{a,b}<sup>3</sup> = {a,b}{a,b}{a,b}
{aaa, aab, aba, abb, baa, bab, bba, bbb}

L<sup>0</sup> = {λ}
{a, bba, aaa}<sup>0</sup> = {λ}

# Substring
a subsequence of consecutive characters

| String | Substring |
| ------ | --------- |
| abbab  | ab        |
| abbab  | abba      |
| abbab  | b         |
| abbab  | bbab      |
### Prefix and Suffixes
w = uv           w = abbab
u = prefix
v = suffix

| prefix | suffix |
| ------ | ------ |
| λ      | abbab  |
| a      | bbab   |
| ab     | bab    |
| abb    | ab     |
| abba   | b      |
| abbab  | λ      |
# The (+) Operation
∑<sup>+</sup> : the set of all possible strings from alphabet ∑ except λ

Example:
∑ = {a, b}
∑* = {λ, a, b, aa, ab, ba, bb, aaa, aab ... }

∑<sup>+</sup> = ∑* - λ
∑<sup>+</sup> = {a, b, aa, ab, ba, bb, aaa, aab ... }