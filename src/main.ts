import './fonts.css';
import './style.css';
import { createWebAudio } from './audio.ts';
import { createController } from './controller.ts';
import { bindHomeInput, createHomeView } from './homeView.ts';
import { initNavigation } from './navigation.ts';

initNavigation();

const controller = createController({ view: createHomeView(), audio: createWebAudio() });
bindHomeInput(
  () => controller.start(),
  (color) => controller.press(color),
);
