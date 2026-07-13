package com.beerdesigner.catalog;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

class BrewingProfileControllerTest {
  private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
  private final BrewingProfileController controller = new BrewingProfileController(jdbc);

  @BeforeEach
  @SuppressWarnings("unchecked")
  void returnProfilesFromQueries() throws Exception {
    ResultSet resultSet = mock(ResultSet.class);
    when(resultSet.getString("id")).thenReturn("profile-1");
    when(resultSet.getString("name")).thenReturn("Perfil");
    when(resultSet.getString("method")).thenReturn("Botella");
    when(resultSet.getString("notes")).thenReturn("Notas");
    when(resultSet.getBigDecimal(anyString())).thenReturn(new BigDecimal("12.5"));
    when(resultSet.getInt(anyString())).thenReturn(10);
    when(jdbc.query(anyString(), any(RowMapper.class))).thenAnswer(invocation -> {
      RowMapper<Object> mapper = invocation.getArgument(1);
      return List.of(mapper.mapRow(resultSet, 0));
    });
  }

  @Test
  void mapsTheThreeKindsOfProfiles() {
    assertThat(controller.mash().getFirst()).satisfies(profile -> {
      assertThat(profile.id()).isEqualTo("profile-1");
      assertThat(profile.mashTimeMin()).isEqualTo(10);
      assertThat(profile.mashOutTimeMin()).isEqualTo(10);
    });
    assertThat(controller.carbonation().getFirst()).satisfies(profile -> {
      assertThat(profile.method()).isEqualTo("Botella");
      assertThat(profile.targetVolumes()).isEqualByComparingTo("12.5");
    });
    assertThat(controller.fermentation().getFirst()).satisfies(profile -> {
      assertThat(profile.primaryDays()).isEqualTo(10);
      assertThat(profile.notes()).isEqualTo("Notas");
    });
  }

  @Test
  void preservesNullMashOutTime() throws Exception {
    ResultSet resultSet = mock(ResultSet.class);
    when(resultSet.getString("id")).thenReturn("profile-1");
    when(resultSet.getInt("mash_time_min")).thenReturn(60);
    when(resultSet.getInt("mash_out_time_min")).thenReturn(0);
    when(resultSet.wasNull()).thenReturn(true);
    when(jdbc.query(startsWith("SELECT * FROM mash_profiles"), any(RowMapper.class))).thenAnswer(invocation -> {
      RowMapper<BrewingProfileController.MashProfile> mapper = invocation.getArgument(1);
      return List.of(mapper.mapRow(resultSet, 0));
    });

    assertThat(controller.mash().getFirst().mashOutTimeMin()).isNull();
  }

  @Test
  void savesAndReturnsEveryProfileType() {
    var mash = new BrewingProfileController.MashProfile("body", "Perfil", new BigDecimal("66"), 60,
        new BigDecimal("78"), 5, "Notas");
    var carbonation = new BrewingProfileController.CarbonationProfile("body", "Perfil", "Botella",
        new BigDecimal("2.4"), new BigDecimal("20"), BigDecimal.ZERO, "Notas");
    var fermentation = new BrewingProfileController.FermentationProfile("body", "Perfil", 10,
        new BigDecimal("19"), 0, new BigDecimal("18"), 14, new BigDecimal("12"), "Notas");

    assertThat(controller.saveMash("profile-1", mash).id()).isEqualTo("profile-1");
    assertThat(controller.saveCarbonation("profile-1", carbonation).id()).isEqualTo("profile-1");
    assertThat(controller.saveFermentation("profile-1", fermentation).id()).isEqualTo("profile-1");
    verify(jdbc).update(startsWith("INSERT INTO mash_profiles"), any(Object[].class));
    verify(jdbc).update(startsWith("INSERT INTO carbonation_profiles"), any(Object[].class));
    verify(jdbc).update(startsWith("INSERT INTO fermentation_profiles"), any(Object[].class));
  }

  @Test
  void deletesEveryProfileType() {
    controller.deleteMash("mash-1");
    controller.deleteCarbonation("carb-1");
    controller.deleteFermentation("ferm-1");

    verify(jdbc).update("DELETE FROM mash_profiles WHERE id=?", "mash-1");
    verify(jdbc).update("DELETE FROM carbonation_profiles WHERE id=?", "carb-1");
    verify(jdbc).update("DELETE FROM fermentation_profiles WHERE id=?", "ferm-1");
  }
}
