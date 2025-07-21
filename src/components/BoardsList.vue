<template>
  <div class="kanban-app-wrapper">
    <div class="nav-toggle" @click="toggleNav">
      <template v-if="!isNavExpanded">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
          <path fill-rule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
        </svg>
      </template>
      <template v-else>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
          <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd" />
        </svg>
      </template>
    </div>

    <div id="sideNav" :class="{ 'side-nav-expanded': isNavExpanded }">
      <div class="nav-content">
        <h1>My Kanban Boards</h1>
        <div class="boards">
          <div class="status-message error" v-show="boardsError !== null">
            {{ boardsError }}
          </div>
          <div class="loading" v-if="isLoadingBoards">
            <img src="../assets/ping_pong_loader.gif" alt="Loading..." />
          </div>
          <router-link
            v-bind:to="{ name: 'Board', params: { id: board.id } }"
            class="board"
            v-for="board in allBoards"
            v-bind:key="board.id"
            v-bind:style="{ 'background-color': board.backgroundColor }"
            v-else
            tag="div"
            @click.native="closeNavOnMobile"
          >
            {{ board.title }}
          </router-link>
          <button
            class="btn addBoard"
            v-if="!isLoadingBoards && !showAddBoard"
            v-on:click="showAddBoard = !showAddBoard"
          >
            Add Board
          </button>
          <form v-if="showAddBoard" @submit.prevent="saveNewBoard">
            Board Title:
            <input type="text" class="form-control" v-model="newBoard.title" required />
            Background Color:
            <input
              type="text"
              class="form-control"
              v-model="newBoard.backgroundColor"
            />
            <button class="btn btn-submit" type="submit">Save</button>
            <button
              class="btn btn-cancel"
              type="button"
              v-on:click="showAddBoard = !showAddBoard"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';

export default {
  data() {
    return {
      showAddBoard: false,
      newBoard: {
        title: "",
        backgroundColor: this.randomBackgroundColor(),
      },
      isNavExpanded: false,
    };
  },
  computed: {
    ...mapGetters(['allBoards', 'isLoadingBoards', 'boardsError']),
  },
  created() {
    // Dispatch the action to fetch all initial Kanban data (boards and cards)
    this.fetchKanbanData();
  },
  mounted() {
    this.isNavExpanded = window.innerWidth > 768;
    this.updateBodyClass();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    document.body.classList.remove('nav-expanded');
  },
  methods: {
    ...mapActions(['fetchKanbanData', 'addBoard']), // Use fetchKanbanData
    saveNewBoard() {
      // The addBoard action will generate an ID and add it to the store
      this.addBoard({ ...this.newBoard, cards: [] }) // Ensure new boards have an empty cards array
        .then(() => {
          this.showAddBoard = false;
          this.newBoard = {
            title: "",
            backgroundColor: this.randomBackgroundColor(),
          };
        })
        .catch(error => {
            console.error("Error adding new board:", error);
            // You might want to display a temporary error message to the user here
        });
    },
    randomBackgroundColor() {
      return "#" + this.generateHexCode();
    },
    generateHexCode() {
      var bg = Math.floor(Math.random() * 16777215).toString(16);
      if (bg.length !== 6) bg = this.generateHexCode();
      return bg;
    },
    toggleNav() {
      if (window.innerWidth <= 768) {
        this.isNavExpanded = !this.isNavExpanded;
        this.updateBodyClass();
      }
    },
    closeNavOnMobile() {
      if (window.innerWidth <= 768) {
        this.isNavExpanded = false;
        this.updateBodyClass();
      }
    },
    handleResize() {
      const wasExpanded = this.isNavExpanded;
      this.isNavExpanded = window.innerWidth > 768;
      if (window.innerWidth <= 768 || wasExpanded !== this.isNavExpanded) {
          this.updateBodyClass();
      }
    },
    updateBodyClass() {
      if (this.isNavExpanded && window.innerWidth <= 768) {
        document.body.classList.add('nav-expanded');
      } else {
        document.body.classList.remove('nav-expanded');
      }
    },
  },
  watch: {
    allBoards: {
      immediate: true,
      handler(newBoards) {
        if (
          this.$route.name === "Home" &&
          newBoards &&
          newBoards.length > 0
        ) {
          // Check if we are already on the correct board to prevent unnecessary redirects
          if (this.$route.params.id !== newBoards[0].id) {
            this.$router.push(`/board/${newBoards[0].id}`);
          }
        }
      }
    }
  }
};
</script>

<style scoped>
/* Styles remain the same */
.kanban-app-wrapper {
  position: relative;
  height: 100%;
}
.nav-toggle {
  position: fixed;
  top: 10px;
  left: 10px;
  cursor: pointer;
  z-index: 1001;
  color: #333;
  width: 30px;
  height: 30px;
  background-color: #fff;
  border-radius: 5px;
  padding: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  display: none;
}
div#sideNav {
  height: 100%;
  width: 20%;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  padding-top: 20px;
  padding-bottom: 20px;
  overflow-x: hidden;
  border-right: solid lightgrey 1px;
  background-color: #f8f9fa;
  transition: transform 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
}
.nav-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}
@media (min-width: 769px) {
  div#sideNav {
    transform: translateX(0);
  }
  .nav-toggle {
    display: none;
  }
}
@media (max-width: 768px) {
  div#sideNav {
    width: 250px;
    transform: translateX(-100%);
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
  }
  div#sideNav.side-nav-expanded {
    transform: translateX(0);
  }
  .nav-toggle {
    display: block;
  }
  div#sideNav:not(.side-nav-expanded) .nav-content {
    display: none;
  }
}
h1 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 1em;
  color: #333;
}
.boards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
}
.board {
  color: #f7fafc;
  border-radius: 8px;
  padding: 10px 15px;
  text-align: center;
  cursor: pointer;
  width: 90%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-in-out;
  font-size: 1em;
  word-break: break-word;
}
.addBoard {
  color: #f7fafc;
  border-radius: 8px;
  background-color: #28a745;
  font-size: 1em;
  width: 90%;
  padding: 15px 20px;
  cursor: pointer;
  margin-top: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease-in-out;
}
.form-control {
  width: calc(90% - 20px);
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  font-size: 1em;
}
.btn {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: .8em;
  margin-right: 5px;
}
.btn-submit {
  background-color: #007bff;
  color: white;
}
.btn-cancel {
  background-color: #dc3545;
  color: white;
}
.btn-submit:hover {
  background-color: #0056b3;
}
.btn-cancel:hover {
  background-color: #bd2130;
}
.loading {
  padding: 20px;
  text-align: center;
}
.loading img {
  width: 50px;
  height: 50px;
}
.board:hover:not(.router-link-active),
.addBoard:hover {
  font-weight: bold;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}
.router-link-active {
  font-weight: bold;
  border: solid blue 3px;
  box-shadow: 0 0 0 3px blue, 0 2px 4px rgba(0, 0, 0, 0.1);
}
.status-message {
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  text-align: center;
  width: 90%;
}
.status-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>