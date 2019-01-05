# encrypt-decrypt-string

https://crypto.stackexchange.com/questions/46955/what-is-the-correct-way-to-implement-pbkdf2-aes-cbc-hmac/46966

You have joined the channel
Topic: Welcome to ##crypto for cryptography theory and practice | To combat spam, you must register with NickServ to chat | Cryptocurrency without discussing cryptography is off-topic. Try ##altcoins | Resources: http://www.cacr.math.uwaterloo.ca/hac https://www.keylength.com | Ethics: http://web.cs.ucdavis.edu/~rogaway/papers/moral-fn.pdf | See also https://reddit.com/r/crypto
eightyeight set the topic at: 8 Aug 2018 at 17:35
Mode: +Cgnst
Created at: 26 Nov 2006 at 07:42
ccapndave
Hey everyone
ccapndave
What would be a good algorithm to use for encrypting a string using a passphrase on a server, then decrypting on a client using the same passphrase?  I'll be using the Web Crypto API on both ends if that makes a difference
eightyeight
ccapndave: you should run the password through a memory hard PKDF, like scrypt or Argon2, to generate a symmetric key
ccapndave
Would PBKDF2 be ok?
ccapndave
That's what the Web Crypto API has
ccapndave
Man, cryptography is complicated
Riastradh
ccapndave: PBKDF2 was a good choice 10-20 years ago, not so much today, but if you don't have scrypt or argon2, well, you can make do with PBKDF2.
ccapndave
Yeah, it doesn't have to be iron hard
ccapndave
This is so confusing.  I have importKey, exportKey and deriveKey
nsh
iron is not used on hardness scales. consider "it doesn't have to be topaz hard"
Riastradh
Sorry.  The _Web Crypto_ API is unnecessarily painfully complicated and ill-conceived.  Cryptography can be much easier to use than that...
nsh
(iron can be very varyingly hard, depending on what you do to it)
ccapndave
It doesn't need to be diamond hard?
ccapndave
Unfortunately web crypto is all I have :(
nsh
well, diamond hard i don't think even scrypt could claim :)
nsh
corundum, on the other hand, is something to aspire to!
Riastradh
illegitimi non cryptorundum
ccapndave
So, it sounds like generating my PBKDF2 key is:  "my passphrase"->importKey->deriveBits
nsh
:)
ccapndave
And if I do that on both ends for the same passphrase it should be able to encrpyt at one end and decrypt on the other end?
ccapndave
Does the IV have to be the same, or does that not matter?
Riastradh
IV has to be the same.
Riastradh
I assume `IV' means `salt' here, for PBKDF2...
ccapndave
?
nsh
you need to put the same things in on both sides
nsh
aye
ccapndave
I have both "salt" and "IV length"
nsh
i don't think PBKDF2 should take an IV
ccapndave
My ultimate goal is that each time it encrypts it comes out different, but it always decrypts to the same thing
nsh
well, that's the thing the IV does but it's an input to the cipher not the KDF
ccapndave
But the other end needs the same IV
ccapndave
How does it get it?
nsh
using the KDF again
nsh
e.g. https://gist.github.com/rafaelsq/5af573af7e2d763869e2f4cce0a8357a
nsh
assuming they did nothing stupid there because i didn't actually read iyt
ccapndave
This looks like the business
ccapndave
Maybe I should just copy paste it :)
nsh
actually they just generate a random IV there
ccapndave
iv = window.crypto.getRandomValues(new Uint8Array(16))
ccapndave
Right
ccapndave
And DecodeGCM doesn't use the `iv` variable?
nsh
better explained here: https://crypto.stackexchange.com/questions/46955/what-is-the-correct-way-to-implement-pbkdf2-aes-cbc-hmac/46966
nsh
you'll need to store and pass on the iv
Riastradh
ccapndave: To encrypt the file:
Riastradh
1. Generate a salt s uniformly at random, and choose PBKDF2 parameters p (hash algorithm, number of iterations, &c.).
kish` is now known as kish
Riastradh
2. Derive a key k = PBKDF2(salt=s, params=p, passphrase).
Riastradh
3. Compute the authenticated ciphertext c = AES-GCM(key=k, nonce=0, message).
Riastradh
4. Store (s, p, c).
Riastradh
ccapndave: To decrypt the file:
Riastradh
1. Retrieve s and p from the stored data.
Riastradh
2. Derive the same key k = PBKDF2(salt=s, params=p, passphrase).
Riastradh
3. Open the authenticated ciphertext with AES-GCM^{-1}(key=k, nonce=0, message).
ccapndave
And the IV is the salt here?
Riastradh
The Web Crypto API might abuse the term `IV' for what I called `nonce' here.  The AES-GCM nonce length should be 96 bits = 12 bytes.
ccapndave
Ah right
Riastradh
I.e., if `IV' is relevant to AES-GCM, then it probably means what I called nonce.
Riastradh
If it's relevant to PBKDF2, then it probably means what I called salt.
ccapndave
The salt is for making the key, the nonce/IV is for the encrpytion algorithm
ccapndave
Amazing
ccapndave
Thanks so much everyone for your explanations
Brnocrist
you should also not reuse the same nonce if you re-encrypt the same file with the same key
Riastradh
YOUR OBLIGATIONS in this system:
Riastradh
1. You must choose the salt so it doesn't collide with any other ones; otherwise an attacker can save effort by attacking multiple encrypted files simultaneously.
Riastradh
2. You must never reuse k.  Want to encrypt a new file, pick a new salt and derive a new k from it.  [Side note: This can be made more efficient but it requires more engineering care.]
Brnocrist
s/same file/modified file/
Riastradh
And by new file, I also include any modifications to the `same file'.
ccapndave
The only thing I don't fully understand is how I am supposed to get the salt and the nonce from the server (encrypter) to the client (decrpyter)
ccapndave
Do I embed it in the encrypted message somewhere?
Riastradh
ccapndave: Yes.  You store (s, p, c), the salt, PBKDF2 parameters, and authenticated ciphertext, all together.
ccapndave
<salt>:<nonce>:<ciphertext>
ccapndave
So that's what I send over the wire?
Riastradh
The nonce is always zero, but you need to send the PBKDF2 parameters.
ccapndave
Why is the nonce always 0?
Riastradh
For example, if one user is on a beefy x86 workstation, and another user is typing away at a tiny arm smartphone, the workstation user can afford many more PBKDF2 iterations than the arm user, and you want to take advantage of as much time in PBKDF2 as you can afford.
ccapndave
But both ends have to use the same number of iterations
ccapndave
For the same ciphertext
ccapndave
So I guess I will have to cater to the lowest possible denominator since the clients are (mostly) smartphones
ccapndave
1000 iterations say?
ccapndave
Ok so:
ccapndave
On the server I derive a key with salt=<something>, iterations=<something>, then I use this to encrypt the message, then I send <salt>:<iterations>:<ciphertext> over HTTPS, then on the other end I do the opposite.
ccapndave
With both sides having independent knowledge of the passphrase
Riastradh
Further, even if you decide up front `I'll just use 100000 iterations,' you'll want to store that so that you have the opportunity to change it for all _new_ encrypted files.
Riastradh
(Deciding to use 100000 iterations is easier than writing logic to calibrate how long PBKDF2 takes so that on the user's machine you use as many iterations as it takes to pass, e.g., 1sec.)
sonOfRa
1000 iterations is extremely low, even for smartphones
18:32 Riastradh
ccapndave: The nonce is always zero because you never reuse the key k.
Riastradh
ccapndave: You should store it as something like `PBKDF2:HMAC-SHA256:<salt>:<iterations>:<ciphertext>', so that when you can later upgrade to scrypt, it'll be easy to identify the old PBKDF2 ciphertexts distinctly from the new scrypt ones.
ccapndave
We can do some stress testing to see how the encryption server gets on with different numbers of iterations against different requrests
ccapndave
Ok
ccapndave
I have to go put my son to bed, but thanks so much
ccapndave
This whole conversation has been copy pasted for later detailed examination :)
