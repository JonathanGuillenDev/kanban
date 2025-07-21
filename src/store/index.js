// src/store/index.js
import Vue from 'vue';
import Vuex from 'vuex';
import { initialKanbanData } from '../db/initialKanbanData.js';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    boards: [],
    allCards: [],
    boardCards: [],
    card: {
      title: '',
      description: '',
      status: '',
      comments: []
    },
    isLoadingBoards: false,
    boardsError: null,
  },
  mutations: {
    SET_BOARDS(state, data) {
      state.boards = data;
    },
    SET_ALL_CARDS(state, data) {
      state.allCards = data;
    },
    SET_BOARD_CARDS(state, data) {
      state.boardCards = data;
    },
    SET_CURRENT_CARD(state, data) {
      state.card = data;
    },
    DELETE_BOARD(state, boardIdToDelete) {
      state.boards = state.boards.filter((board) => {
        return board.id !== boardIdToDelete;
      });
      state.allCards = state.allCards.filter(card => card.boardId !== boardIdToDelete);
      if (state.boardCards.length > 0 && state.boardCards[0].boardId === boardIdToDelete) {
        state.boardCards = [];
      }
    },
    SET_LOADING_BOARDS(state, status) {
      state.isLoadingBoards = status;
    },
    SET_BOARDS_ERROR(state, error) {
      state.boardsError = error;
    },
    ADD_NEW_BOARD(state, newBoard) {
      const maxBoardId = state.boards.reduce((max, board) => Math.max(max, board.id), 0);
      const maxCardId = state.allCards.reduce((max, card) => Math.max(max, card.id), 0);
      // Ensure the new board gets a unique ID
      newBoard.id = Math.max(maxBoardId, maxCardId) + 1; // Take max of all existing IDs
      state.boards.push(newBoard);
    },
    // FIX: ADD_NEW_CARD now expects a full card object with boardId already assigned
    ADD_NEW_CARD(state, cardToAdd) {
      state.allCards.push(cardToAdd);
    },
    UPDATE_CARD_IN_BOARD(state, updatedCard) {
      const allCardsIndex = state.allCards.findIndex(card => card.id === updatedCard.id);
      if (allCardsIndex !== -1) {
        state.allCards.splice(allCardsIndex, 1, updatedCard);
      }
      const boardCardsIndex = state.boardCards.findIndex(card => card.id === updatedCard.id);
      if (boardCardsIndex !== -1) {
        state.boardCards.splice(boardCardsIndex, 1, updatedCard);
      }
    },
    DELETE_CARD_FROM_BOARD(state, { boardId, cardId }) {
      state.allCards = state.allCards.filter(card => card.id !== cardId);
      state.boardCards = state.boardCards.filter(card => card.id !== cardId);
    },
  },
  actions: {
    async fetchKanbanData({ commit }) {
      commit('SET_LOADING_BOARDS', true);
      commit('SET_BOARDS_ERROR', null);
      try {
        commit('SET_BOARDS', initialKanbanData.boards);
        commit('SET_ALL_CARDS', initialKanbanData.cards);
        console.log("Kanban data loaded successfully from initialKanbanData:", initialKanbanData.boards, initialKanbanData.cards);
      } catch (error) {
        console.error("Error loading Kanban data from initialKanbanData:", error);
        commit('SET_BOARDS_ERROR', 'Failed to load Kanban data from local source.');
      } finally {
        commit('SET_LOADING_BOARDS', false);
      }
    },

    addBoard({ commit }, newBoard) {
      commit('ADD_NEW_BOARD', newBoard);
      console.log("New board added locally:", newBoard);
    },
    // FIX: Destructure the payload to get boardId and the card data
    async addNewCard({ commit, state }, { boardId, card }) {
      // Generate a new unique ID for the card
      const maxExistingId = Math.max(
          ...state.boards.map(b => b.id),
          ...state.allCards.map(c => c.id),
          0 // Start from 0 if no boards/cards exist
      );
      const newCardId = maxExistingId + 1;

      // Create the full card object, including the generated ID and boardId
      const cardToAdd = { ...card, id: newCardId, boardId: boardId };

      // FIX: Also add the new card's ID to the corresponding board's 'cards' array
      // This is crucial for your board data structure if boards store card IDs
      const targetBoard = state.boards.find(b => b.id === boardId);
      if (targetBoard) {
        if (!targetBoard.cards) {
          targetBoard.cards = []; // Initialize if it doesn't exist
        }
        targetBoard.cards.push(newCardId);
        // This mutation isn't strictly necessary if you're directly mutating
        // the object in `state.boards` but committing could trigger reactivity
        // for other components observing the `boards` state directly if needed.
        // For simplicity with local data, direct mutation might be fine.
        // If you had a SET_BOARD_CARDS_ARRAY mutation, you could use it.
        // For now, assume direct mutation is okay given your current setup.
      } else {
          console.warn(`Board with ID ${boardId} not found when trying to add card.`);
          // You might want to throw an error here to propagate it back to the component
      }


      commit('ADD_NEW_CARD', cardToAdd); // Commit the complete card object
      console.log("New card added locally:", cardToAdd);
    },
    updateExistingCard({ commit }, updatedCardData) {
      commit('UPDATE_CARD_IN_BOARD', updatedCardData);
      console.log("Card updated locally:", updatedCardData);
    },
    deleteExistingCard({ commit }, { cardId, boardId }) {
      commit('DELETE_CARD_FROM_BOARD', { boardId, cardId });
      // FIX: Also remove the card ID from the board's cards array
      const targetBoard = initialKanbanData.boards.find(b => b.id === boardId);
      if (targetBoard && targetBoard.cards) {
          targetBoard.cards = targetBoard.cards.filter(id => id !== cardId);
      }
      console.log(`Card ${cardId} deleted locally from board ${boardId}.`);
    },
    deleteBoard({ commit }, boardId) {
      commit('DELETE_BOARD', boardId);
      console.log(`Board ${boardId} deleted locally.`);
    },

    fetchBoardCards({ commit, state }, boardId) {
      const cardsForBoard = state.allCards.filter(card => card.boardId === boardId);
      commit('SET_BOARD_CARDS', cardsForBoard);
    },
    fetchCardDetail({ commit, state }, cardId) {
      const card = state.allCards.find(c => c.id === cardId);
      if (card) {
        const cardComments = initialKanbanData.comments ? initialKanbanData.comments.filter(comment => comment.cardId === cardId) : [];
        const cardWithComments = { ...card, comments: cardComments };
        commit('SET_CURRENT_CARD', cardWithComments);
      } else {
        console.warn(`Card with ID ${cardId} not found.`);
        commit('SET_CURRENT_CARD', null);
        throw new Error('Card not found');
      }
    }
  },
  getters: {
    allBoards: state => state.boards,
    isLoadingBoards: state => state.isLoadingBoards,
    boardsError: state => state.boardsError,
    currentCard: state => state.card,
    getCardsForBoard: (state) => (boardId) => {
      return state.allCards.filter(card => card.boardId === boardId);
    }
  },
  modules: {}
});