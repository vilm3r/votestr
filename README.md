# Votestr

Access the web app: [https://votestr.com](https://votestr.com)

Votestr is a polling app that uses nostr for authentication and blind signatures to anonymize your votes. The Site, Sign, and Tally services can all be self-hosted by separate entities (and ideally so) to combat the risks of timing attacks.

The web app requires users to use extensions (such as nos2x or Alby) to create polls or vote. I know this is quite annoying, especially for mobile users, but I'm not interested in handling private keys in app. Ideally in the future nostr social frontends will integrate with Votestr and the standalone site will become redundant.

## Core components:

### Site

A NextJS SSR web app that is the front end for creating and submitting votes.

### Sign

An Express api that verifies voting eligibility and blind signs authentication and voting signatures from the user.

### Tally

An Express api that accepts votes by checking that they were signed by the Sign service and calculates results.

### Nostr relay

Used for storing the poll configuration data and poll creator profile data. _ Note that communication between the user and Sign+Tally are not over nostr but direct http calls. Due to the leaky nature of nostr, using ephemeral comms would allow for trivial timing attacks. _

![voting sequence diagram](https://github.com/vilm3r/votestr/blob/main/docs/mermaid/no_auth.png?raw=true)

## Dev

```
npm nx run-many --target=migrate-up # run prisma migrations
npx nx run-many --target=serve # for site + sign api + tally api
npx nx run-many --target=serve-worker # for sign worker + tally worker
```

## Build

```
npm run site-build
npm run sign-build
npm run tally-build
```

The build artifacts will be in the root `dist` folder

## Future Features

- [ ] Sign + Site - pubkey allowlist
- [ ] Sign + Site - nip05-only allowlist
- [ ] Sign + Site - follows/followers-only allowlist
- [ ] Tally + Site - publish vote results with signatures for voter verification

## License

Distributed under the MIT License. See [LICENSE file](LICENSE).
