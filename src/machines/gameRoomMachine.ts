import { setup, assign } from 'xstate';

export const gameRoomMachine = setup({
  types: {
    context: {} as {
      isFirstTime: boolean;
      pointsEarned: number;
    },
    events: {} as
      | { type: 'INITIALIZE'; isFirstTime: boolean; startType: string }
      | { type: 'START_QUIZ' }
      | { type: 'CONTINUE_STUDY' }
      | { type: 'SKIP_QUIZ' }
      | { type: 'FINISH'; score: number; }
      | { type: 'RESTART' }
  },
  actions: {
    recordResults: assign({
      pointsEarned: ({ context, event }) => {
        if (event.type === 'FINISH') {
            return context.isFirstTime ? event.score : 0;
        }
        return context.pointsEarned;
      }
    }),
    setInitState: assign({
        isFirstTime: ({ event }) => {
            if (event.type === 'INITIALIZE') {
                return event.isFirstTime;
            }
            return true;
        }
    })
  }
}).createMachine({
  id: 'gameRoom',
  initial: 'idle',
  context: {
    isFirstTime: true,
    pointsEarned: 0,
  },
  states: {
    idle: {
      on: {
        INITIALIZE: [
          {
            target: 'study',
            guard: ({ event }) => event.startType === 'STUDY',
            actions: 'setInitState'
          },
          {
            target: 'quiz',
            guard: ({ event }) => event.startType === 'QUIZ',
            actions: 'setInitState'
          },
          {
            target: 'no_quiz',
            guard: ({ event }) => event.startType === 'NO_QUIZ',
            actions: 'setInitState'
          },
          {
            target: 'result',
            guard: ({ event }) => event.startType === 'RESULT',
            actions: 'setInitState'
          },
          {
            target: 'study',
            actions: 'setInitState'
          }
        ]
      }
    },
    study: {
      on: {
        START_QUIZ: { target: 'quiz' },
        SKIP_QUIZ: { target: 'no_quiz' }
      }
    },
    quiz: {
      on: {
        CONTINUE_STUDY: { target: 'study' },
        FINISH: {
          target: 'result',
          actions: 'recordResults'
        }
      }
    },
    no_quiz: {
      on: {
        FINISH: {
          target: 'result',
          actions: 'recordResults'
        }
      }
    },
    result: {
      on: {
        RESTART: { target: 'idle' }
      }
    }
  }
});
