// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Handle mobile audio context
let audioContext;
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const audio = new Audio('http://nov.rlnk.ru:8000/radio.hitfmn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.querySelector('.volume-value');
    const volumeIcon = document.querySelector('.volume-icon i');
    const statusText = document.getElementById('statusText');
    const playIcon = playPauseBtn.querySelector('.play-icon i');
    const stationBtn = document.getElementById('stationBtn');
    const currentStationText = document.getElementById('currentStation');
    const currentStationIcon = stationBtn.querySelector('.station-icon i');
    const modal = document.getElementById('stationModal');
    const closeBtn = modal.querySelector('.close-btn');
    const stationItems = modal.querySelectorAll('.station-item');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = themeToggle.querySelector('i');
    
    let isPlaying = false;
    let currentVolume = volumeSlider.value / 100;

    // Функция для добавления обработчиков событий с поддержкой касаний
    function addClickHandler(element, handler) {
        element.addEventListener('click', handler);
        element.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handler(e);
        }, { passive: false });
    }

    // Theme functionality
    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            updateThemeIcon(savedTheme);
        } else {
            // Set default theme
            const defaultTheme = 'light';
            document.documentElement.setAttribute('data-theme', defaultTheme);
            localStorage.setItem('theme', defaultTheme);
            updateThemeIcon(defaultTheme);
        }
    }

    function updateThemeIcon(theme) {
        if (themeIcon) {
            themeIcon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    // Initialize theme
    initTheme();

    // Add theme toggle event listener
    if (themeToggle) {
        addClickHandler(themeToggle, toggleTheme);
    }

    // Update initial volume display
    volumeValue.textContent = `${volumeSlider.value}%`;
    updateVolumeIcon(volumeSlider.value);

    // Modal functionality
    addClickHandler(stationBtn, () => {
        modal.classList.add('show');
    });

    addClickHandler(closeBtn, () => {
        modal.classList.remove('show');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });

    // Filter functionality
    filterButtons.forEach(button => {
        addClickHandler(button, () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedCity = button.dataset.city;
            stationItems.forEach(item => {
                if (selectedCity === 'all' || item.dataset.city === selectedCity) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });

    // Station selection with touch support
    stationItems.forEach(item => {
        let touchStartY = 0;
        let touchEndY = 0;
        const minSwipeDistance = 5; // Минимальное расстояние для определения свайпа

        item.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        item.addEventListener('touchmove', (e) => {
            touchEndY = e.touches[0].clientY;
        }, { passive: true });

        item.addEventListener('touchend', (e) => {
            const swipeDistance = Math.abs(touchEndY - touchStartY);
            
            // Если было движение пальца (скролл), не выбираем станцию
            if (swipeDistance > minSwipeDistance) {
                return;
            }

            const url = item.dataset.url;
            const name = item.querySelector('.station-name').textContent;
            const icon = item.querySelector('.station-icon i').className;
            
            stationItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            currentStationText.textContent = name;
            currentStationIcon.className = icon;
            
            if (isPlaying) {
                audio.pause();
            }
            
            audio.src = url;
            audio.volume = currentVolume;
            
            audio.play().then(() => {
                isPlaying = true;
                playIcon.className = 'fas fa-pause';
                statusText.textContent = `Playing: ${name}`;
            }).catch(error => {
                console.error('Error playing audio:', error);
                statusText.textContent = 'Error playing stream';
                isPlaying = false;
                playIcon.className = 'fas fa-play';
            });
            
            modal.classList.remove('show');
        });

        // Добавляем обработчик клика для десктопной версии
        item.addEventListener('click', (e) => {
            // Проверяем, что это не событие от мобильного устройства
            if (!e.touches) {
                const url = item.dataset.url;
                const name = item.querySelector('.station-name').textContent;
                const icon = item.querySelector('.station-icon i').className;
                
                stationItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                currentStationText.textContent = name;
                currentStationIcon.className = icon;
                
                if (isPlaying) {
                    audio.pause();
                }
                
                audio.src = url;
                audio.volume = currentVolume;
                
                audio.play().then(() => {
                    isPlaying = true;
                    playIcon.className = 'fas fa-pause';
                    statusText.textContent = `Playing: ${name}`;
                }).catch(error => {
                    console.error('Error playing audio:', error);
                    statusText.textContent = 'Error playing stream';
                    isPlaying = false;
                    playIcon.className = 'fas fa-play';
                });
                
                modal.classList.remove('show');
            }
        });
    });

    // Play/Pause functionality
    addClickHandler(playPauseBtn, () => {
        if (isPlaying) {
            audio.pause();
            playIcon.className = 'fas fa-play';
            statusText.textContent = 'Paused';
        } else {
            audio.play().catch(error => {
                console.error('Error playing audio:', error);
                statusText.textContent = 'Error playing stream';
            });
            playIcon.className = 'fas fa-pause';
            statusText.textContent = `Playing: ${currentStationText.textContent}`;
        }
        isPlaying = !isPlaying;
    });

    // Volume control with touch support
    volumeSlider.addEventListener('input', (e) => {
        const value = e.target.value;
        currentVolume = value / 100;
        audio.volume = currentVolume;
        volumeValue.textContent = `${value}%`;
        updateVolumeIcon(value);
    });

    volumeSlider.addEventListener('touchstart', (e) => {
        e.stopPropagation();
    }, { passive: true });

    volumeSlider.addEventListener('touchmove', (e) => {
        e.stopPropagation();
    }, { passive: true });

    // Handle audio events
    audio.addEventListener('playing', () => {
        updateStatus();
        requestWakeLock();
    });

    audio.addEventListener('pause', () => {
        statusText.textContent = 'Paused';
        playIcon.className = 'fas fa-play';
        isPlaying = false;
        if (wakeLock) {
            wakeLock.release();
            wakeLock = null;
        }
    });

    audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        statusText.textContent = 'Error: Could not connect to stream';
        playIcon.className = 'fas fa-play';
        isPlaying = false;
    });

    // Helper functions
    function updateStatus() {
        if (isPlaying) {
            statusText.textContent = `Playing: ${currentStationText.textContent}`;
            playIcon.className = 'fas fa-pause';
        } else {
            statusText.textContent = 'Ready to play';
            playIcon.className = 'fas fa-play';
        }
    }

    function updateVolumeIcon(value) {
        if (value == 0) {
            volumeIcon.className = 'fas fa-volume-mute';
        } else if (value <= 33) {
            volumeIcon.className = 'fas fa-volume-off';
        } else if (value <= 66) {
            volumeIcon.className = 'fas fa-volume-down';
        } else {
            volumeIcon.className = 'fas fa-volume-up';
        }
    }

    // Set initial volume
    audio.volume = currentVolume;

    // Add touch event listeners for mobile
    document.addEventListener('touchstart', initAudioContext);

    // Prevent double-tap zoom on buttons
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
        });
    });

    // Handle screen wake lock for continuous playback
    let wakeLock = null;
    async function requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                wakeLock = await navigator.wakeLock.request('screen');
            }
        } catch (err) {
            console.log('Wake Lock error:', err);
        }
    }

    // Handle visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isPlaying) {
            requestWakeLock();
        }
    });
}); 