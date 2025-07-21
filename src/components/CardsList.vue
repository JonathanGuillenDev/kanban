<template>
  <div>
    <div class="header">
      <h1>{{ boardTitle }}</h1>
      <router-link
        :to="{ name: 'AddCard', params: {boardID: this.boardId} }"
        custom
        v-slot="{ navigate }"
        v-if="!isLoading"
      >
        <button @click="navigate" role="link" class="btn addNewCard">Add New Card</button>
      </router-link>

      <button
        class="btn btn-cancel deleteBoard"
        v-if="!isLoading"
        @click="deleteBoardConfirmed"
      >Delete Board</button>
    </div>
    <div class="loading" v-if="isLoading">
      <img src="../assets/ping_pong_loader.gif" alt="Loading..." />
    </div>
    <div v-else>
      <div class="status-message error" v-show="errorMsg !== ''">{{errorMsg}}</div>
      <div class="boards">
        <board-column title="Planned" :boardID="this.boardId" columnStatus="Planned" />
        <board-column title="In Progress" :boardID="this.boardId" columnStatus="In Progress" />
        <board-column title="Completed" :boardID="this.boardId" columnStatus="Completed" />
      </div>
    </div>
    <div class="board-actions" v-if="!isLoading">
      <router-link to="/">Back to Boards</router-link>
    </div>
  </div>
</template>

<script>
import BoardColumn from "@/components/BoardColumn";
import { mapGetters, mapActions } from 'vuex';

export default {
  name: "cards-list",
  components: {
    BoardColumn
  },
  data() {
    return {
      // FIX: 'title' data property is no longer needed if boardTitle is derived from Vuex
      // title: "",
      boardId: 0,
      isLoading: true,
      errorMsg: ""
    };
  },
  methods: {
    ...mapActions(['fetchBoardCards', 'deleteBoard']), // Map actions

    async retrieveCards() {
      this.isLoading = true;
      this.errorMsg = "";
      try {
        // FIX: Remove the backend service call.
        // The board title will now come from a computed property using Vuex state.
        // We only need to dispatch fetchBoardCards to populate boardCards state.
        await this.fetchBoardCards(this.boardId);

        // FIX: Check if the board itself exists in the store
        if (!this.currentBoard) {
            this.errorMsg = "Board not found. It may have been deleted or you have entered an invalid board ID.";
            alert(this.errorMsg);
            this.$router.push("/");
            return; // Stop execution if board not found
        }

      } catch (error) {
        // This catch block might still trigger if fetchBoardCards has an issue
        // (though less likely with local data).
        console.error("Error in retrieveCards (CardsList.vue):", error);
        this.errorMsg = "Error retrieving board details or cards. Please try again.";
      } finally {
        this.isLoading = false;
      }
    },
    async deleteBoardConfirmed() {
      if (confirm("Deleting this board deletes all cards. There's no undo. Are you sure?")){
        try {
          // No need to check for response.status === 200, as Vuex action directly modifies state
          await this.deleteBoard(this.boardId);
          alert("Board successfully deleted.");
          this.$router.push("/");
        } catch (error) {
          // This catch is mostly for errors within the Vuex action itself (e.g., if boardId is invalid internally)
          this.errorMsg = "Error deleting board locally. See console for details.";
          console.error("Error deleting board:", error);
        }
      }
    }
  },
  created() {
    this.boardId = Number(this.$route.params.id); // Ensure boardId is a number
    // FIX: Add watcher for route ID changes
    // Initial fetch is handled by immediate: true in the watcher
    // If you prefer to keep created, make immediate: false in watcher and uncomment this:
    // this.retrieveCards();
  },
  // FIX: Watch for changes in the route's boardID
  watch: {
    '$route.params.id': {
      immediate: true, // Run immediately on component creation
      handler(newBoardId) {
        if (newBoardId) { // Only run if newBoardId is defined
          this.boardId = Number(newBoardId);
          this.retrieveCards();
        }
      }
    }
  },
  computed: {
    ...mapGetters(['allBoards']), // Map allBoards getter from store
    // FIX: Get the current board from the store based on boardId
    currentBoard() {
      return this.allBoards.find(board => board.id === this.boardId);
    },
    // FIX: Derive boardTitle from currentBoard
    boardTitle() {
      return this.currentBoard ? this.currentBoard.title : 'Loading Board...';
    }
  }
};
</script>

<style>
/* Styles remain the same */
.boards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 15px;
}
.board-actions {
  text-align: center;
  padding: 15px 0;
}
.board-actions a:link,
.board-actions a:visited {
  color: blue;
  text-decoration: none;
}
.board-actions a:hover {
  text-decoration: underline;
}
.btn.addNewCard {
  color: #fff;
  background-color: #508ca8;
  border-color: #508ca8;
}
.header {
  display: flex;
  align-items: center;
}
.header h1 {
  flex-grow: 1;
}
</style>