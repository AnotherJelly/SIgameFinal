import React, { useState, useEffect, useCallback, useMemo } from "react";

const settings = {
    maxPlayers: 6,
    maxRounds: 3,
    maxCategories: 8,
    maxLengthPlayer: 30,
    maxLengthPoints: 10,
    maxLengthCategory: 40,
    maxLengthQuestion: 150,
};

const generateId = () => Math.random().toString(36).slice(2, 11);

function InputText ( {id, text, value, placeholder, maxlength, onChange} ) {
    return (
        <div key={id} className="modal-content-question">
            <span>{text}</span>
            <input
                type="text"
                value={value}
                placeholder={placeholder}
                maxLength={maxlength}
                onChange={onChange}
            />
        </div>
    );
}

function InputWithDelete ( {id, value, placeholder, maxlength, onChange, onDelete} ) {
    return (
        <div key={id} className="modal-content-row">
            <input
                type="text"
                className="modal-content-row__input"
                value={value}
                placeholder={placeholder}
                maxLength={maxlength}
                onChange={onChange}
            />
            <button className="modal-content-row__delete" onClick={() => onDelete(id)}>
                <i className="fas fa-times"></i>
            </button>
        </div>
    );
}

function SettingsCategoryElement ( {category, catIndex, removeCategory, handleCategoryChange, roundIndex} ) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const toggleCollapse = () => {
      setIsCollapsed(prevState => !prevState);
    };

    return (
        <div className="modal-content__block" key={category.id}>
            <InputWithDelete 
                id={category.id} 
                value={category.name}
                placeholder={`Название категории ${catIndex + 1}`}
                maxlength={settings.maxLengthCategory}
                onChange={(e) => handleCategoryChange(category.id, e.target.value)}
                onDelete={removeCategory}
            />
            <button className="modal-content__collapse" onClick={toggleCollapse}>{isCollapsed ? 'Развернуть' : 'Свернуть'}</button>
            {!isCollapsed && category.questions.map((curQuestion, qIndex) => (
                <React.Fragment key={curQuestion.id}>
                    <div className="modal-content-block__question">
                        <InputText
                            id={curQuestion.id}
                            text={`${100 * (roundIndex + 1) * (qIndex + 1)}:`}
                            value={curQuestion.text ?? ''}
                            placeholder={`Вопрос ${qIndex + 1}`}
                            maxlength={settings.maxLengthQuestion}
                            onChange={(e) =>
                                handleCategoryChange(category.id, null, curQuestion.id, e.target.value, 'text')
                            }
                        />                        
                        <select
                            value={curQuestion.questionType}
                            onChange={(e) =>
                                handleCategoryChange(category.id, null, curQuestion.id, e.target.value, 'questionType')
                            }>
                            <option value="ordinary">Стандартный</option>
                            <option value="cat">Кот в мешке</option>
                            <option value="bet">Со ставкой</option>
                        </select>
                    </div>
                    <InputText
                        id={curQuestion.id}
                        text={"Ответ:"}
                        value={curQuestion.answer ?? ''}
                        placeholder={`Ответ ${qIndex + 1}`}
                        maxlength={settings.maxLengthQuestion}
                        onChange={(e) =>
                            handleCategoryChange(category.id, null, curQuestion.id, e.target.value, 'answer')
                        }
                    />
                </React.Fragment>
            ))}
        </div>
    );
}

const SettingsPlayersBlock = React.memo(function SettingsPlayersBlock ( {playersData, newPlayers, setNewPlayers} ) {

    useEffect(() => {
        setNewPlayers(playersData);
    }, [playersData]);

    const handlePlayerChange = useCallback((id, value, type) => {
        setNewPlayers(prevPlayers => {
            return prevPlayers.map(player => {
                if (player.id !== id) return player;
                if (type === 'name') {
                    return { ...player, name: value };
                } else if (type === 'points') {
                    const parsed = value === '' || value === '-' ? value : parseInt(value, 10);
                    const newPoints = isNaN(parsed) ? value : parsed;
                    return { ...player, points: newPoints };
                }
                return player;
            });
        });
    }, [setNewPlayers]);

    const addPlayer = useCallback(() => {
        setNewPlayers(prev => [
            ...prev,
            { id: generateId(), name: `Игрок ${prev.length + 1}`, points: 0, hasAnswered: false }
        ]);
    }, [setNewPlayers]);

    const removePlayer = useCallback(id => {
        setNewPlayers(prev => prev.filter(p => p.id !== id));
    }, [setNewPlayers]);

    return (
        <div className="modal-content__players">
            <div className="modal-content__subtitle">
                <span>Игроки</span>
            </div>
            {newPlayers.map((player, index) => (
                <div key={player.id}>
                    <InputWithDelete 
                        id={player.id} 
                        value={player.name}
                        placeholder={`Имя игрока ${index + 1}`}
                        maxlength={settings.maxLengthPlayer}
                        onChange={(e) => handlePlayerChange(player.id, e.target.value, 'name')}
                        onDelete={removePlayer}
                    />
                    <InputText
                        id={player.id}
                        text={"Очки"}
                        value={player.points}
                        placeholder={`Изменить очки ${player.name}`}
                        maxlength={settings.maxLengthPoints}
                        onChange={(e) => handlePlayerChange(player.id, e.target.value, 'points')}
                    />
                </div>
            ))}
            <button onClick={addPlayer} className="modal-content__btn--add" disabled={newPlayers.length > settings.maxPlayers}>
                Добавить игрока
            </button>
        </div>
    );
});

const SettingsCategoryBlock = React.memo(function SettingsCategoryBlock ( { id, roundIndex, categories, setNewCategories, removeRound } ) {

    const [isCollapsed, setIsCollapsed] = useState(false);
    
    useEffect(() => {
        setNewCategories(categories, roundIndex);
    }, [categories]);

    const toggleCollapse = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

    const removeCategory = useCallback((catId) => {
        setNewCategories(
            categories.filter(cat => cat.id !== catId),
            roundIndex
        );
    }, [categories, roundIndex, setNewCategories]);

    const addCategory = useCallback(() => {
        if (categories.length >= settings.maxCategories) return;

        const base = categories.length;
        const newQs = Array.from({ length: 5 }, (_, i) => ({
            id: generateId(),
            questionType: "ordinary",
            text:    ``,
            answer:  ``
        }));
        const newCat  = {
            id: generateId(),
            name: ``,
            questions: newQs
        };

        setNewCategories(
            [...categories, newCat],
            roundIndex
        );
    }, [categories, roundIndex, setNewCategories]);

    const handleCategoryChange = useCallback((catId, categoryName, questionId, value, field) => {
        const updated = categories.map(cat => {
            if (cat.id !== catId) return cat;

            const copyCat = { ...cat };
            if (categoryName != null) {
                copyCat.name = categoryName;
            }
            if (questionId != null) {
                copyCat.questions = copyCat.questions.map(q => 
                q.id !== questionId 
                    ? q 
                    : { ...q, [field]: value }
                );
            }
            return copyCat;
        });
        setNewCategories(updated, roundIndex);
    }, [categories, roundIndex, setNewCategories]);

    return (
        <div className="modal-content__players">
            <div className="modal-content__subtitle">
                <div className="modal-content__subtitle--delete">
                    <span>Раунд {roundIndex + 1}</span>
                    <button className="" onClick={() => removeRound(id)}><i className="fas fa-times"></i></button>
                </div>
                <button className="modal-content__collapse" onClick={toggleCollapse}>{isCollapsed ? 'Развернуть' : 'Свернуть'}</button>
            </div>
            {!isCollapsed && (
                <>
                    {categories.map((category, catIndex) => (
                        <SettingsCategoryElement
                            key={category.id}
                            category={category}
                            catIndex={catIndex}
                            removeCategory={removeCategory}
                            handleCategoryChange={handleCategoryChange}
                            roundIndex={roundIndex}
                        />
                    ))}
                    <button onClick={addCategory} className="modal-content__btn--add" disabled={categories.length >= settings.maxCategories}>Добавить категорию</button>
                </>
            )}
        </div>
    );
});

const SettingsRoundBlock = React.memo(function SettingsRoundBlock({ newRounds, setNewRounds }) {
    const removeRound = useCallback((id) => {
        setNewRounds(prev =>
            prev.filter(r => r.id !== id)
        );
    }, [setNewRounds]);

    const addRound = useCallback(() => {
        setNewRounds(prev => {
            if (prev.length >= settings.maxRounds) return prev;
            const index = prev.length;
            const newRound = {
                id: generateId(),
                name: `Round ${index + 1}`,
                categories: [
                    {
                        id: generateId(),
                        name: ``,
                        questions: Array.from({ length: 5 }, () => ({
                            id: generateId(),
                            questionType: "ordinary",
                            text: "",
                            answer: ""
                        }))
                    }
                ]
            };
            return [...prev, newRound];
        });
    }, [setNewRounds]);

    const setNewCategories = useCallback((updatedCategories, roundIndex) => {
        setNewRounds(prev => {
            const updatedRounds = [...prev];
            updatedRounds[roundIndex] = {
                ...updatedRounds[roundIndex],
                categories: updatedCategories
            };
            return updatedRounds;
        });
    }, [setNewRounds]);

    return (
        <div className="modal-content__players">
            {newRounds.map((round, roundIndex) => (
                <SettingsCategoryBlock
                    key={round.id}
                    id={round.id}
                    roundIndex={roundIndex}
                    categories={round.categories}
                    setNewCategories={setNewCategories}
                    removeRound={removeRound}
                />
            ))}
            <button
                onClick={addRound}
                className="modal-content__btn--add modal-content__btn--wide"
                disabled={newRounds.length >= settings.maxRounds}
            >
                Добавить раунд
            </button>
        </div>
    );
});

export default function SettingsModal ({ rounds, playersData, handleSaveSettings, closeModal, isModalOpen }) {

    const [newRounds, setNewRounds] = useState(rounds);
    const [newPlayers, setNewPlayers] = useState(playersData);
    
    useEffect(() => {
        if (isModalOpen) {
            setNewRounds(rounds);
            setNewPlayers(playersData);
        }
    }, [isModalOpen]);

    return (
        <div className={`modal-overlay ${isModalOpen ? "open" : ""}`}>
            <div className="modal-background" onClick={closeModal}></div>
            <div className="modal-content">
                <div className="modal-content__title">
                    <span>Настройки</span>
                    <button onClick={closeModal}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-content__main">
                    <SettingsPlayersBlock 
                        playersData={playersData}
                        newPlayers={newPlayers}
                        setNewPlayers={setNewPlayers}
                    />

                    <SettingsRoundBlock
                        rounds={rounds}
                        newRounds={newRounds}
                        setNewRounds={setNewRounds}
                    />
                </div>

                <button className="modal-content__btn--save" onClick={() => handleSaveSettings(newPlayers, newRounds)}>Сохранить изменения</button>
                
            </div>
        </div>
    );
}