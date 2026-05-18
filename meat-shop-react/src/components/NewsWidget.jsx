import React, { useState, useEffect } from 'react';
import { getNews } from '../utils/db';
import './NewsWidget.css';

const NewsWidget = ({ onNewsClick }) => {
  const [news, setNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);

  useEffect(() => {
    setNews(getNews());
  }, []);

  const handleNewsClick = (newsItem) => {
    setSelectedNews(newsItem);
    if (onNewsClick) {
      onNewsClick(newsItem);
    }
  };

  const handleCloseModal = () => {
    setSelectedNews(null);
  };

  return (
    <>
      <div 
        className="news-widget"
        style={{ 
          backgroundImage: 'url(\'/news.png\')', 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          padding: '20px',
          borderRadius: '12px',
          color: '#ffffff'
        }}
      >
        <h2 style={{ color: '#ffffff' }}>📰 Новости</h2>
        <div className="news-list">
          {news.map((item) => (
            <div 
              key={item.id} 
              className="news-item"
              onClick={() => handleNewsClick(item)}
              style={{ 
                color: '#ffffff',
                backgroundColor: 'transparent',
                transition: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {item.image && (
                <img src={item.image} alt={item.title} />
              )}
              <div className="news-content">
                <h3 style={{ color: '#ffffff' }}>{item.title}</h3>
                <p className="news-date" style={{ color: '#ffffff' }}>{item.date}</p>
                <p className="news-preview" style={{ color: '#ffffff' }}>{item.content.substring(0, 100)}...</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedNews && (
        <div className="news-modal-overlay" onClick={handleCloseModal}>
          <div className="news-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={handleCloseModal}>✕</button>
            {selectedNews.image && (
              <img src={selectedNews.image} alt={selectedNews.title} />
            )}
            <div className="news-modal-content">
              <h2>{selectedNews.title}</h2>
              <p className="news-modal-date">{selectedNews.date}</p>
              <p className="news-modal-text">{selectedNews.content}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsWidget;