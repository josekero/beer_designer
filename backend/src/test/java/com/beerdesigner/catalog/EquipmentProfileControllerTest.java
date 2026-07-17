package com.beerdesigner.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

class EquipmentProfileControllerTest {
  private final EquipmentProfileRepository repository = mock(EquipmentProfileRepository.class);
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final EquipmentProfileController controller = new EquipmentProfileController(repository, jdbc);

  @BeforeEach void authenticate() {
    com.beerdesigner.TestSecurity.asAdmin();
    when(jdbc.update(any(String.class), any(Object[].class))).thenReturn(1);
  }
  @AfterEach void clearAuthentication() { com.beerdesigner.TestSecurity.clear(); }

  @Test
  void listsAndSavesEquipmentProfilesUsingTheRouteIdentifier() {
    EquipmentProfile stored = mock(EquipmentProfile.class);
    when(repository.findVisible(com.beerdesigner.TestSecurity.USER_ID)).thenReturn(List.of(stored));
    when(repository.findById("eq-20")).thenReturn(Optional.of(stored));
    var dto = new EquipmentProfileController.EquipmentDto("body-id", "Equipo 20 L",
        decimal(20), decimal(24), decimal(72), decimal(3), decimal(1), decimal(1), decimal(1),
        decimal(100), "Notas", decimal(30), decimal(30), decimal(25));

    assertThat(controller.list()).containsExactly(stored);
    assertThat(controller.save("eq-20", dto)).isSameAs(stored);
    verify(jdbc).update(startsWith("INSERT INTO equipment_profiles"), any(Object[].class));
  }

  @Test
  void deletesUnusedProfiles() {
    controller.delete("eq-20");
    verify(jdbc).update("DELETE FROM equipment_profiles WHERE id=? AND owner_id IS NOT DISTINCT FROM ?", "eq-20", null);
    verify(repository).flush();
  }

  @Test
  void reportsAConflictWhenARecipeUsesTheProfile() {
    org.mockito.Mockito.doThrow(new DataIntegrityViolationException("used"))
        .when(jdbc).update(any(String.class), any(Object[].class));

    assertThatThrownBy(() -> controller.delete("eq-20"))
        .isInstanceOfSatisfying(ResponseStatusException.class,
            error -> assertThat(error.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
  }

  private BigDecimal decimal(int value) {
    return BigDecimal.valueOf(value);
  }
}
