<template>
  <!-- New wrapper div because a Vue component needs a single root element -->
  <div class="kanban-app-wrapper">
    <!-- Nav Toggle button, now a sibling to #sideNav, ensuring it's always visible -->
    <div class="nav-toggle" @click="toggleNav">
      <template v-if="!isNavExpanded">
        <!-- Hamburger icon -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
          <path fill-rule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clip-rule="evenodd" />
        </svg>
      </template>
      <template v-else>
        <!-- Close icon -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
          <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clip-rule="evenodd" />
        </svg>
      </template>
    </div>

    <div id="sideNav" :class="{ 'side-nav-expanded': isNavExpanded }">
      <div class="nav-content">
        <h1>My Kanban Boards</h1>
        <div class="boards">
          <div class="status-message error" v-show="errorMsg !== ''">
            {{ errorMsg }}
          </div>
          <div class="loading" v-if="isLoading">
            <img src="../assets/ping_pong_loader.gif" alt="Loading..." />
          </div>
          <router-link
            v-bind:to="{ name: 'Board', params: { id: board.id } }"
            class="board"
            v-for="board in this.$store.state.boards"
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
            v-if="!isLoading && !showAddBoard"
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
import boardsService from "../services/BoardService";

export default {
  data() {
    return {
      isLoading: true,
      showAddBoard: false,
      newBoard: {
        title: "",
        backgroundColor: this.randomBackgroundColor(),
      },
      errorMsg: "",
      isNavExpanded: false, // New data property for navigation state
    };
  },
  created() {
    this.retrieveBoards();
  },
  mounted() {
    // Set initial nav state based on screen size and update body class
    this.isNavExpanded = window.innerWidth > 768; // Expand on desktop by default
    this.updateBodyClass();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    // Clean up body class on component unmount
    document.body.classList.remove('nav-expanded');
  },
  methods: {
    retrieveBoards() {
      boardsService.getBoards().then((response) => {
        this.$store.commit("SET_BOARDS", response.data);
        this.isLoading = false;

        if (
          this.$route.name == "Home" &&
          response.status === 200 &&
          response.data.length > 0
        ) {
          this.$router.push(`/board/${response.data[0].id}`);
        }
      })
      .catch((error) => {
        this.handleError(error, "Error retrieving boards.");
        this.isLoading = false;
      });
    },
    saveNewBoard() {
      this.isLoading = true;
      boardsService
        .addBoard(this.newBoard)
        .then((response) => {
          if (response.status === 201) {
            this.retrieveBoards();
            this.showAddBoard = false;
            this.newBoard = {
              title: "",
              backgroundColor: this.randomBackgroundColor(),
            };
            this.errorMsg = ""; // Clear any previous error messages
          }
          this.isLoading = false;
        })
        .catch((error) => {
          this.handleError(error, "Error adding new board.");
          this.isLoading = false;
        });
    },
    randomBackgroundColor() {
      return "#" + this.generateHexCode();
    },
    generateHexCode() {
      var bg = Math.floor(Math.random() * 16777215).toString(16);
      if (bg.length !== 6) bg = this.generateHexCode(); // Ensure 6 characters
      return bg;
    },
    toggleNav() {
      // Only toggle if on mobile
      if (window.innerWidth <= 768) {
        this.isNavExpanded = !this.isNavExpanded;
        this.updateBodyClass(); // Update body class on toggle
      }
    },
    closeNavOnMobile() {
      // Close the nav when a board is clicked on mobile
      if (window.innerWidth <= 768) {
        this.isNavExpanded = false;
        this.updateBodyClass(); // Update body class on close
      }
    },
    handleResize() {
      const wasExpanded = this.isNavExpanded;
      this.isNavExpanded = window.innerWidth > 768; // Adjust nav state on window resize
      // Only update body class if state actually changed or it's mobile
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
    handleError(error, message) {
      if (error.response) {
        this.errorMsg = `${message} Response was ${error.response.statusText}`;
      } else if (error.request) {
        this.errorMsg = `${message} Unreachable server.`;
      } else {
        this.errorMsg = `${message} Could not create request.`;
      }
      console.error(error); // Log the full error for debugging
    },
  },
};
</script>

<style scoped>
/* New wrapper for the component's root element */
.kanban-app-wrapper {
  position: relative; /* Needed for positioning the nav-toggle if it were absolute */
  height: 100%; /* Ensure it takes full height if it's the main app wrapper */
}

/* Nav Toggle (Hamburger/Close Icon) - Now always fixed to the viewport */
.nav-toggle {
  position: fixed;
  top: 10px; /* Adjust as needed */
  left: 10px; /* Adjust as needed */
  cursor: pointer;
  z-index: 1001; /* Ensure it's above everything else */
  color: #333;
  width: 30px;
  height: 30px;
  background-color: #fff; /* Background for visibility */
  border-radius: 5px;
  padding: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  display: none; /* Hidden by default on desktop */
}

/* General styles for the side navigation */
div#sideNav {
  height: 100%;
  width: 20%; /* Default desktop width */
  position: fixed;
  z-index: 1000; /* Ensure it's above other content */
  left: 0;
  top: 0;
  padding-top: 20px;
  padding-bottom: 20px;
  overflow-x: hidden;
  border-right: solid lightgrey 1px;
  background-color: #f8f9fa; /* Light background for the nav */
  transition: transform 0.3s ease-in-out; /* Smooth transitions for sliding */
  display: flex;
  flex-direction: column;
}

/* Hide content when collapsed on mobile */
.nav-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%; /* Take full width of sideNav */
}

/* Desktop styles */
@media (min-width: 769px) {
  div#sideNav {
    transform: translateX(0); /* Always visible on desktop */
  }
  .nav-toggle {
    display: none; /* Hide toggle button on desktop */
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  div#sideNav {
    width: 250px; /* Fixed width for expanded mobile nav */
    transform: translateX(-100%); /* Collapsed by default */
    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2); /* Add shadow for depth */
  }

  div#sideNav.side-nav-expanded {
    transform: translateX(0); /* Expanded state */
  }

  .nav-toggle {
    display: block; /* Show toggle button on mobile */
  }

  /* Hide content when nav is collapsed on mobile, show when expanded */
  div#sideNav:not(.side-nav-expanded) .nav-content {
    display: none;
  }
}

h1 {
  text-align: center;
  margin-bottom: 20px; /* Add some space below the title */
  font-size: 1em; /* Adjust font size */
  color: #333;
}

.boards {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px; /* Use gap for tighter spacing between boards */
  padding: 0 8px; /* Add horizontal padding */
}

.board {
  color: #f7fafc;
  border-radius: 8px; /* Slightly less rounded */
  padding: 10px 15px; /* Reduced padding for less height */
  text-align: center;
  cursor: pointer;
  width: 90%; /* Make boards take more width */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* Subtle shadow */
  transition: all 0.2s ease-in-out; /* Smooth hover effect */
  font-size: 1em; /* Slightly larger font */
  word-break: break-word; /* Prevent long words from overflowing */
}

.addBoard {
  color: #f7fafc;
  border-radius: 8px;
  background-color: #28a745;
  font-size: 1em;
  width: 90%; /* Match board width */
  padding: 15px 20px; /* Reduced padding */
  cursor: pointer;
  margin-top: 10px; /* Space above the button */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: background-color 0.2s ease-in-out;
}

.form-control {
  width: calc(90% - 20px); /* Adjust width for padding */
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
  margin-right: 5px; /* Space between buttons */
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
  transform: translateY(-2px); /* Slight lift on hover */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.router-link-active {
  font-weight: bold;
  border: solid blue 3px; /* Reduced border thickness */
  box-shadow: 0 0 0 3px blue, 0 2px 4px rgba(0, 0, 0, 0.1); /* Add outer shadow for active state */
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
