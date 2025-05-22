import { useState, useEffect } from "react";

import SettingsModal from './SettingsModal';
import CategoryGrid from './CategoryGrid';

export function App() {

    const [playersData, setPlayersData] = useState([
        { id: 1, name: 'Игрок 1', points: 0, hasAnswered: false },
        { id: 2, name: 'Игрок 2', points: 0, hasAnswered: false },
        { id: 3, name: 'Игрок 3', points: 0, hasAnswered: false },
    ]);

    const [rounds, setRounds] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/rounds")
            .then((res) => res.json())
            .then((data) => setRounds(data))
            .catch((err) => console.error("Ошибка загрузки:", err));
    }, []);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const validateRounds = (rounds) => {
        if (!Array.isArray(rounds)) return false;
    
        for (const round of rounds) {
            if (typeof round !== 'object' || round === null) return false;
            if (typeof round.id !== 'string' || round.id.trim() === '') return false;
            if (typeof round.name !== 'string' || round.name.trim() === '') return false;
            if (!Array.isArray(round.categories)) return false;
    
            for (const category of round.categories) {
                if (typeof category !== 'object' || category === null) return false;
                if (typeof category.id !== 'string' || category.id.trim() === '') return false;
                if (typeof category.name !== 'string' || category.name.trim() === '') return false;
                if (!Array.isArray(category.questions)) return false;
    
                for (const question of category.questions) {
                    if (typeof question !== 'object' || question === null) return false;
                    if (typeof question.id !== 'string' || question.id.trim() === '') return false;
                    if (typeof question.questionType !== 'string' || question.questionType.trim() === '') return false;
                    if (typeof question.text !== 'string' || question.text.trim() === '') return false;
                    if (typeof question.answer !== 'string' || question.answer.trim() === '') return false;
                }
            }
        }
    
        return true;
    };

    const handleSaveSettings = (newPlayers, newRounds) => {

        if (!validateRounds(newRounds)) {
            console.error('Ошибка: данные раундов некорректные. Отправка отменена.');
            alert('Невозможно сохранить: проверьте все поля раундов, категорий и вопросов.');
            return;
        }

        setPlayersData(newPlayers);
        setRounds(newRounds);
    
        fetch('http://localhost:5000/rounds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRounds)
        })
            .then(response => response.text())
            .catch(error => console.error('Ошибка при отправке POST-запроса:', error));
    
        closeModal();
    };

    const handleAwardPoints = (playerId, selectedQuestionValue) => {
        setPlayersData((prevPlayers) =>
            prevPlayers.map((player) =>
                player.id === playerId
                ? { ...player, points: player.points + selectedQuestionValue }
                : { ...player, hasAnswered: false }
            )
        );
    };
        
    const handleDeductPoints = (playerId, selectedQuestionValue) => {
        setPlayersData((prevPlayers) =>
            prevPlayers.map((player) =>
                player.id === playerId
                ? { ...player, points: player.points - selectedQuestionValue, hasAnswered: true }
                : player
            )
        );
    };

    const handleResetAnswers = (updatedPlayers) => {
        if (updatedPlayers) {
            setPlayersData(updatedPlayers);
        } else {
            setPlayersData(prev =>
                prev.map(p => ({ ...p, hasAnswered: false }))
            );
        }
    };
    
    return (
        <div className="App">

            <button className="button-setting" onClick={openModal}>
                <i className="fas fa-cogs"></i> Настройки
            </button>

            <SettingsModal
                rounds={rounds}
                playersData={playersData}
                handleSaveSettings={handleSaveSettings}
                closeModal={closeModal}
                isModalOpen={isModalOpen}
            />

            <CategoryGrid 
                playersData={playersData}
                setPlayersData={setPlayersData}
                rounds={rounds}
                onAwardPoints={handleAwardPoints}
                onDeductPoints={handleDeductPoints}
                resetAnswers={handleResetAnswers}
            />

        </div>
    );
}