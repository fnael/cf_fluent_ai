#1
I want to do a project to try and get a cloudflare internship: 

Optional Assignment Instructions: We plan to fast track review of candidates 
who complete an assignment to build a type of AI-powered application on Cloudflare. 
An AI-powered application should include the following components:
* LLM (recommend using Llama 3.3 on Workers AI), or an external LLM of your choice
* Workflow / coordination (recommend using Workflows, Workers or Durable Objects)
* User input via chat or voice (recommend using Pages or Realtime)
* Memory or state

My idea is an app called FluentAI, an app that helps you learn a language. 
What im thinking is the following: An app when you open there is an input text, 
where you type a language you want to learn. It will store that language, lets say 
we type spanish, and then french. We will have both spanish and french on the 
initial menu. Then we click on the language to learn. Lets say we click on spanish. 
We will have 3 buttons:

1. Practice, where you just chat with an AI in spanish, and it corrects you if you 
   are wrong.
2. Translate/Lookup: On the translation part, you can translate words and it will 
   give you the translation along with synonyms, and uses in sentences. Or translate 
   a whole sentence. In the look up part sometimes you cant really translate a word, 
   so you can type like thing you use to write on paper and it would appear pencil 
   in spanish, along with an image.
3. Quiz: it will be just like multiple choice questions where to learn new vocab and 
   expressions, taking into account the previous mistakes and right answers from the past

Help me make a base with the cloudflare infrastructure with steps.

#2
Do the UI for the practice, and also the DO for it

Make the durable object be called FluentState, and make it so it just has history.
Make it simple. Maybe divide the do part into a separate file so it can be used for other things other than the practice

#3
Help me implement the translation and look up part following this structure.

2. Translate/Lookup: On the translation part, you can translate words and it will 
   give you the translation along with synonyms, and uses in sentences. Or translate 
   a whole sentence. In the look up part sometimes you cant really translate a word, 
   so you can type like thing you use to write on paper and it would appear pencil 
   in spanish, along with an image. Keep it simple

#4
Change it so the translation and look up is on the same page, no button to switch 
between them. Change the translation part so it has 2 boxes like google translate. 
One is english the other is the language you are learning

#5
The image generation is not working, fix it

#6
Change the translate so only the left box is writable, and there is a button to 
change the languages

#7
Ok its working good, but one thing the synonyms for translating hello show up like this:
Change it so there only shows synonyms in the target language

#8
Ok now I have another issue. If im in the practice mode, and go to the translation mode, 
the conversation starts over. I want it to be persistent, and only starts over if I 
delete it

#9
Ok now add the quiz mode. Just make it so it asks multiple choice questions, or fast 
answer writable questions, so a user can learn new vocabulary or expressions.

Add like a history of the quiz so the ai, can ask something that the user failed, and 
dont ask something that is the user is getting all right
