<template>
  <div>
    <div class="header">
      <h1>{{ title }}</h1>
      <router-link
        tag="button"
        class="btn addNewCard"
        :to="{ name: 'AddCard', params: {boardID: this.boardId} }"
        v-if="!isLoading"
      >Add New Card</router-link>
      <button
        class="btn btn-cancel deleteBoard"
        v-if="!isLoading"
        v-on:click="deleteBoardConfirmed"
      >Delete Board</button>
    </div>
    <div class="loading" v-if="isLoading">
      <img src="../assets/ping_pong_loader.gif" />
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
import { mapGetters, mapActions } from 'vuex'; // Import mapGetters and mapActions

export default {
  name: "cards-list",
  components: {
    BoardColumn
  },
  data() {
    return {
      title: "", // Title can still be local if only used here
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
        // You'll need to fetch the board title separately or include it in your getCards response
        // For now, let's assume `getCards` (or a separate `getBoard` call) provides the title.
        // If your getCards endpoint returns { title: "Board Name", cards: [...] }
        const response = await this.$services.boardsService.getCards(this.boardId); // Using local service for initial title fetch if not in store
        this.title = response.data.title;

        // Now dispatch the action to fetch cards for this board into the store
        await this.fetchBoardCards(this.boardId);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          alert("Board cards not available. This board may have been deleted or you have entered an invalid board ID.");
          this.$router.push("/");
        } else {
          if (error.response) {
            this.errorMsg = `Error retrieving cards. Response was ${error.response.statusText}`;
          } else if (error.request) {
            this.errorMsg = "Error retrieving cards. Server couldn't be reached.";
          } else {
            this.errorMsg = "Error retrieving cards. Request could not be created.";
          }
        }
      } finally {
        this.isLoading = false;
      }
    },
    async deleteBoardConfirmed() {
      if (confirm("Deleting this board deletes all cards. There's no undo. Are you sure?")){
        try {
          const response = await this.deleteBoard(this.boardId);
          if (response.status === 200) {
            alert("Board successfully deleted.");
            this.$router.push("/");
          }
        } catch (error) {
          if (error.response){
            this.errorMsg = "Error deleting board. Response was "+error.response.statusText;
          } else if (error.request){
            this.errorMsg = "Error deleting board. Server couldn't be reached."
          }
          else {
            this.errorMsg = "Error deleting board. Request could not be created."
          }
        }
      }
    }
  },
  created() {
    this.boardId = Number(this.$route.params.id); // Ensure boardId is a number
    this.retrieveCards();
  },
  computed: {
    ...mapGetters(['getCardsForBoard']), // Map the getter to retrieve cards for the current board
    // Filter the cards obtained from the getter
    planned() {
      return this.getCardsForBoard(this.boardId).filter(card => card.status === "Planned");
    },
    inProgress() {
      return this.getCardsForBoard(this.boardId).filter(card => card.status === "In Progress");
    },
    completed() {
      return this.getCardsForBoard(this.boardId).filter(card => card.status === "Completed");
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