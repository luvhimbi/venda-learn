import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WORD_CATEGORIES } from '../../data/wordCards';
import type { WordCategory } from '../../data/wordCards';
import { useAudio } from '../../hooks/useAudio';
import '../../styles/word-cards.css';

const WordCards: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const { speakVenda, isPlayingAudio } = useAudio();

  // Reset word index when category changes
  useEffect(() => {
    if (selectedCategory) {
      setCurrentWordIndex(0);
    }
  }, [selectedCategory]);

  // Autoplay logic
  useEffect(() => {
    let interval: any;
    if (autoplay && selectedCategory && !isPlayingAudio) {
      interval = setTimeout(() => {
        if (currentWordIndex < selectedCategory.words.length - 1) {
          handleNext();
        } else {
          setAutoplay(false);
        }
      }, 3000);
    }
    return () => clearTimeout(interval);
  }, [autoplay, currentWordIndex, selectedCategory, isPlayingAudio]);

  const handleNext = () => {
    if (selectedCategory && currentWordIndex < selectedCategory.words.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
    }
  };

  const handlePlayAudio = () => {
    if (selectedCategory) {
      speakVenda(selectedCategory.words[currentWordIndex].native);
    }
  };

  return (
    <div className="word-cards-container">
      <header className="word-cards-header">
        <div>
          <h1 className="fw-black text-white mb-0">Word Cards</h1>
          <p className="text-muted smallest uppercase ls-1">Visual Vocabulary</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn-game btn-game-white rounded-circle p-0" style={{ width: '40px', height: '40px' }}>
            <i className="bi bi-search"></i>
          </button>
        </div>
      </header>

      <div className="word-cards-grid">
        {WORD_CATEGORIES.map((cat) => (
          <motion.div
            key={cat.id}
            className="category-card"
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(cat)}
          >
            <div className="category-card-title">{cat.title}</div>
            <div className="category-card-image">
              <img src={cat.image} alt={cat.title} />
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            className="word-detail-overlay"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="word-detail-header">
              <button className="close-btn" onClick={() => setSelectedCategory(null)}>
                <i className="bi bi-x-lg"></i>
              </button>
              <h2 className="text-white fs-4 fw-black mb-0">{selectedCategory.title}</h2>
              <div className="autoplay-control">
                <span>Autoplay</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={autoplay}
                    onChange={(e) => setAutoplay(e.target.checked)}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>

            <div className="carousel-container">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedCategory.words[currentWordIndex].id}
                  className="word-slide"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="word-info">
                    <h3 className="native-word">{selectedCategory.words[currentWordIndex].native}</h3>
                    <p className="english-word">{selectedCategory.words[currentWordIndex].english}</p>
                  </div>

                  <div className="word-image-large">
                    <img src={selectedCategory.words[currentWordIndex].image} alt={selectedCategory.words[currentWordIndex].english} />
                  </div>

                  <div className="action-buttons">
                    <button
                      className={`sound-btn ${isPlayingAudio ? 'animate-pulse' : ''}`}
                      onClick={handlePlayAudio}
                    >
                      <i className={`bi ${isPlayingAudio ? 'bi-volume-up-fill' : 'bi-volume-up'}`}></i>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="carousel-controls">
              <button
                className="btn-game btn-game-white rounded-circle"
                style={{ width: '60px', height: '60px' }}
                onClick={handlePrev}
                disabled={currentWordIndex === 0}
              >
                <i className="bi bi-chevron-left fs-3"></i>
              </button>
              <div className="text-white fw-black ls-1">
                {currentWordIndex + 1} / {selectedCategory.words.length}
              </div>
              <button
                className="btn-game btn-game-white rounded-circle"
                style={{ width: '60px', height: '60px' }}
                onClick={handleNext}
                disabled={currentWordIndex === selectedCategory.words.length - 1}
              >
                <i className="bi bi-chevron-right fs-3"></i>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WordCards;







