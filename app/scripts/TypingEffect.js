import {TimelineLite} from "gsap";
import {ConvertSpan} from "./utils/Dom";

export default class TypingEffect {

    constructor(contText1,contText2,contText3,timeDelay,contText4,timeDelay2) {

        let txt1 = document.querySelector(contText1);
        let txt2 = document.querySelector(contText2);
        new ConvertSpan(txt1);
        new ConvertSpan(txt2);

        let tl = new TimelineLite();
        tl.staggerFrom(txt1.querySelectorAll('span'),0.1, {autoAlpha:0},0.05,'+=2')
          .staggerFrom(txt2.querySelectorAll('span'),0.1, {autoAlpha:0},0.05)
          if(contText3)   {
              let txt3 = document.querySelector(contText3);
              new ConvertSpan(txt3);
              tl.staggerFrom(txt3.querySelectorAll('span'),0.1, {autoAlpha:0},0.05, timeDelay)
              if(contText4) {
                  let txt4 = document.querySelector(contText4);
                  new ConvertSpan(txt4);
                  tl.staggerFrom(txt4.querySelectorAll('span'),0.1, {autoAlpha:0},0.05,timeDelay2)
              }
          }


    }
}