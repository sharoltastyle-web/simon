import './fonts.css';
import './style.css';
import { createAboutView } from './aboutView.ts';
import { createWebAudio } from './audio.ts';
import { createController } from './controller.ts';
import { bindHomeInput, createHomeView } from './homeView.ts';
import { initLifecycle, isPageVisible } from './lifecycle.ts';
import { currentScreen, initNavigation } from './navigation.ts';
import { createScoreStore } from './scoreStorage.ts';

const aboutView = createAboutView();
const scores = createScoreStore();
aboutView.renderScores(scores.load());

const controller = createController({
  view: createHomeView(),
  audio: createWebAudio(),
  isVisible: isPageVisible,
  scores,
  onScoresChanged: (updated) => aboutView.renderScores(updated),
});
bindHomeInput(
  () => controller.start(),
  (color) => controller.press(color),
  () => controller.continueFromTap(),
);

const syncLifecycle = initLifecycle(controller, currentScreen);
initNavigation(() => syncLifecycle());
