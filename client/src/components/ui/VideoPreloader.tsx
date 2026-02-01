import React from 'react';

// Import all video assets used in HomePage.tsx
import mentorVideo from '../../assets/mentor journey.mp4';
import backgroundVideo from '../../assets/backgournd.mp4'; // Preserving typo from HomePage
import creativeJourneyVid from '../../assets/creative journey.mp4';
import artStudioVid from '../../assets/art studio.mp4';
import magicLabVid from '../../assets/magiclab.mp4';
import graphicNovelVid from '../../assets/graphicnovel.mp4';
import cartoonBookVid from '../../assets/cartoon book.mp4';
import pictureBookVid from '../../assets/picturebook.mp4';
import cartoonVid from '../../assets/cartoon.mp4';
import videoVid from '../../assets/video.mp4';
import comicVid from '../../assets/comic.mp4';
import mirrorBtnVid from '../../assets/mirrorbtn.mp4';
import jumpVid from '../../assets/jump into art.mp4';
import cardVid from '../../assets/greetingcard.mp4';
import audioVid from '../../assets/audio.mp4';

const VIDEOS_TO_PRELOAD = [
    mentorVideo,
    backgroundVideo,
    creativeJourneyVid,
    artStudioVid,
    magicLabVid,
    graphicNovelVid,
    cartoonBookVid,
    pictureBookVid,
    cartoonVid,
    videoVid,
    comicVid,
    mirrorBtnVid,
    jumpVid,
    cardVid,
    audioVid
];

export const VideoPreloader: React.FC = () => {
    return (
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
            {VIDEOS_TO_PRELOAD.map((src, index) => (
                <video
                    key={index}
                    src={src}
                    preload="auto"
                    muted
                    playsInline
                    width="1"
                    height="1"
                />
            ))}
        </div>
    );
};
