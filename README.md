# Joyful Claims Review Assistant

# Try it out

https://claims-assistant-web-zkwpg.ondigitalocean.app/

# Run locally

Running this in the repo root spins up the lightweight Express server and Vite frontend server:

    npm run dev 

## Technical Choices

I went with a React + Vite frontend and a lightweight Express backend. I was contemplating Python since it's much easier to integrate AI libraries than NodeJS, but I'm more familiar with Javascript and wanted to easily understand the changes AI was making as I built this.

I used Claude Sonnet 4 as my LLM, specifically because it ranks well in [reasoning and language](https://livebench.ai/#/?sort=Reasoning%20Average), is almost [half the price](https://platform.claude.com/docs/en/about-claude/pricing) of the Claude SOTA models available and personally I've just found Claude to be the most empathetic model. 

I wanted to retain the changes made on the site when testing it out, so I store the changes in memory and write them to a temp JSON file. When you want to reset the data back to the default state that you started with, you can hit the ... (should be horizontal whoops) in the top right and reset the app state. I probably didn't need the temp JSON and it's kind of overkill, but this ensures a server crash doesn't wipe the changes made.

I deployed a monolithic web service to DigitalOcean, primarily because I already have a few apps hosted there and I'm a little more familiar with getting it up and running. Although, I was heavily contemplating Railway and Vercel since they're much easier and cleaner.

There were quite a few requirements in the PRD and I wanted to spend more time on the experience and aesthetic, with less on architecture since it's just a SPA. That led me to rely on AI heavily in my implementation to deliver as much of a breadth that I could, while still diving deep into the craft and usability. I had multiple Claude Code terminals running, and was hopping back and forth with my changes I wanted to optimize my time. I still reviewed majority of the code that it was adding as I went along and ended up tweaking a lot. One thing I've noticed is that Claude leans into using useEffect more liberally than I would, but other than that I agree with a lot of the implementation details it took. One area of improvement would definitely be the message streaming from the Vercel AI SDK. I think it was poorly written and frankly messy, but I personally didn't want to spend more time on it since it was a small piece and still worked as expected. The system prompt was AI-generated as well, and I think that made sense since Claude definitely knew more about insurance claims than I did.


## Design

I think this is where I had the most fun. I drew a lot of inspo from the Joyful site because I personally like the theming and think it presents as a reliable, mature but still revolutionary brand.

I was originally thinking of making a JIRA board type SPA, but that would likely require the chat assistant to be a smaller piece of the interface with more emphasis on task management. That's what led me to the hierarchical approach where I give almost equal emphasis to each part of the flow. I think this design leaves room for each type of user to shine, whether they're a power chat user, or someone that just wants to tackle the review queue with typical search/sort/filter/categorize tooling available. 

In the chat assistant, I created a human-in-the-loop UX by surfacing cards when the assistant has an action or tool it would like to perform. I found these to be the most clear to users when there is a pending action to take so they don't walk away thinking they're done. I was also contemplating smaller message bubbles as suggested replies or actions, but thought it was too casual given the type of product I'm building.

For tool calling, I also found an easy QOL optimization by improving the "get claim" call to be a little looser. In the PRD it mentions it should fetch claim info given a specific claim ID (CLM-1001). But personally, I don't think users would type like that, and would rather just type in an ID or name and hope the assistant figures out the rest. So I updated the tool call to support more casual fetching ("get me the claim for James Wilson" or "get me info on 1003").    

I also drew some inspiration from MCP, and tool calls referencing a specific claim are pulled up in the claim details pane as the message is being streamed from the LLM. This helps the user read the info from the claim details pane, without waiting for the AI to finish typing. It also promotes the human-in-the-loop pattern, as they're more likely to actually read the claim details and understand this is a real person, versus if the AI just spits out a bunch of info and suggests an action.

I'm pretty happy to where I got in the 4 hours I spent, but given more time I would continue adding tooling to the chat experience and add some AI suggestions to the claim details pane itself, so users don't have to always rely on the chat to determine next steps. 


